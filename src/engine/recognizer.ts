/**
 * src/engine/recognizer.ts
 *
 * SignSpeak's orchestration layer: camera in, words out. Owns the landmarkers,
 * the sliding window, the burst tracker and the classifier, and publishes a
 * plain snapshot each frame that the UI renders. Framework-agnostic on
 * purpose so the React side stays a thin subscription.
 *
 * The loop mirrors the reference demo's main.ts: a window of frames is scored
 * only while the hands are moving, the scores across one burst are averaged,
 * and the answer is committed when the burst ends. Nothing is answered while
 * the hands are not tracked well enough to trust.
 */
import { FrameWindow } from "./buffer";
import { Classifier, Smoother, median, ranked, type Candidate } from "./classifier";
import { mirrorSequence } from "./mirror";
import { BurstTracker, frameMovement } from "./motion";
import {
  LEFT_HAND_START,
  LEFT_SHOULDER,
  NUM_COORDS,
  RIGHT_HAND_START,
  RIGHT_SHOULDER,
  TARGET_LEN,
  processSequence,
  trackedFraction,
} from "./preprocessing";
import { HAND_BONES, createTrackers, trackFrame, type Trackers } from "./tracking";

export type { Candidate };

const MODEL_URL = "/models/sign_cnn.onnx";
const LABELS_URL = "/models/labels.json";

/** Frames the classifier looks back over; near the median length of a sign. */
const WINDOW = 48;
/** Fraction of the window that must contain a tracked hand before answering. */
const MIN_TRACKED = 0.5;
/** Weight on the newest scores when smoothing the live ranking. */
const SMOOTHING = 0.35;
/** How many recent timings the medians are taken over. */
const TIMING_HISTORY = 60;
const CANDIDATES_SHOWN = 5;

export type Status = "idle" | "loading" | "camera" | "live" | "error";

export type Phase =
  | "filling" // window not yet full
  | "no-hands" // hands not tracked well enough
  | "waiting" // hands present, nothing moving
  | "reading" // a burst is in progress
  | "result" // a burst just ended with a confident answer
  | "unclear"; // a burst ended without a clear answer

export interface Result {
  label: string;
  probability: number;
  candidates: Candidate[];
  at: number;
}

export interface Snapshot {
  status: Status;
  error?: string;
  phase: Phase;
  note: string;
  /** Live ranking while reading; the committed ranking after. */
  candidates: Candidate[];
  /** The last committed answer, if any. */
  result?: Result;
  handsTracked: number;
  movement: number;
  burstFrames: number;
  fps: number;
  landmarkMs: number;
  modelMs: number;
  vocabulary: number;
}

export interface RecognizerOptions {
  /** Smallest averaged score the recognizer will name a sign on. */
  threshold?: number;
  /** Reflect the tensor about the body midline (for a mirrored camera setup). */
  reflect?: boolean;
  /** Called when a burst ends with a confident answer. */
  onWord?: (result: Result) => void;
}

type Listener = (snapshot: Snapshot) => void;

function record(history: number[], value: number): void {
  history.push(value);
  if (history.length > TIMING_HISTORY) history.shift();
}

export class Recognizer {
  private trackers?: Trackers;
  private classifier?: Classifier;
  private stream?: MediaStream;
  private raf = 0;
  private pending = false;
  private stopped = false;

  private frames = new FrameWindow(WINDOW);
  private smoother = new Smoother(SMOOTHING);
  private burst = new BurstTracker();
  private landmarkTimes: number[] = [];
  private modelTimes: number[] = [];
  private frameTimes: number[] = [];
  private lastFrameAt = 0;
  private lastTimestamp = 0;

  threshold: number;
  reflect: boolean;
  private onWord?: (result: Result) => void;

  private listeners = new Set<Listener>();
  private snapshot: Snapshot = {
    status: "idle",
    phase: "filling",
    note: "Not started",
    candidates: [],
    handsTracked: 0,
    movement: 0,
    burstFrames: 0,
    fps: 0,
    landmarkMs: 0,
    modelMs: 0,
    vocabulary: 0,
  };

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly overlay: HTMLCanvasElement,
    options: RecognizerOptions = {},
  ) {
    this.threshold = options.threshold ?? 0.35;
    this.reflect = options.reflect ?? false;
    this.onWord = options.onWord;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  get current(): Snapshot {
    return this.snapshot;
  }

  private publish(patch: Partial<Snapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener(this.snapshot);
  }

  async start(): Promise<void> {
    this.stopped = false;
    try {
      this.publish({ status: "loading", note: "Loading hand tracking and the sign model" });
      const [trackers, classifier] = await Promise.all([
        createTrackers(),
        Classifier.create(MODEL_URL, LABELS_URL),
      ]);
      if (this.stopped) return;
      this.trackers = trackers;
      this.classifier = classifier;

      this.publish({ status: "camera", note: "Asking for camera access" });
      await this.startCamera();
      if (this.stopped) return;

      this.publish({
        status: "live",
        phase: "filling",
        note: "Warming up",
        vocabulary: classifier.vocabulary,
      });
      this.loop();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.publish({ status: "error", error: message, note: message });
    }
  }

  stop(): void {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
    this.video.srcObject = null;
    this.trackers?.hands.close();
    this.trackers?.pose.close();
    this.trackers = undefined;
    this.frames.clear();
    this.smoother.clear();
    this.burst.clear();
    this.publish({ status: "idle", phase: "filling", note: "Stopped", candidates: [] });
  }

  private async startCamera(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: false,
    });
    this.stream = stream;
    this.video.srcObject = stream;
    if (this.video.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise((resolve) =>
        this.video.addEventListener("loadedmetadata", resolve, { once: true }),
      );
    }
    await this.video.play();
    this.overlay.width = this.video.videoWidth;
    this.overlay.height = this.video.videoHeight;
  }

  private loop(): void {
    const tick = () => {
      if (this.stopped) return;
      if (!this.pending) {
        this.pending = true;
        void this.step().finally(() => {
          this.pending = false;
        });
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private telemetry(): Pick<Snapshot, "fps" | "landmarkMs" | "modelMs"> {
    const frameTime = median(this.frameTimes);
    return {
      fps: frameTime > 0 ? 1000 / frameTime : 0,
      landmarkMs: median(this.landmarkTimes),
      modelMs: median(this.modelTimes),
    };
  }

  private async step(): Promise<void> {
    const trackers = this.trackers;
    const classifier = this.classifier;
    if (!trackers || !classifier || this.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    const now = performance.now();
    if (this.lastFrameAt) record(this.frameTimes, now - this.lastFrameAt);
    this.lastFrameAt = now;

    // The landmarkers reject a frame that looks older than the last one.
    const timestamp = Math.max(now, this.lastTimestamp + 1);
    this.lastTimestamp = timestamp;

    const landmarkStart = performance.now();
    const tracked = trackFrame(trackers, this.video, timestamp);
    record(this.landmarkTimes, performance.now() - landmarkStart);

    this.frames.push(tracked.frame);
    this.drawOverlay(tracked.frame, tracked.poseSeen);

    const recent = this.frames.snapshot();
    const frameCount = this.frames.filled;
    const handsTracked = Math.max(
      trackedFraction(recent, frameCount, LEFT_HAND_START),
      trackedFraction(recent, frameCount, RIGHT_HAND_START),
    );

    if (!this.frames.full) {
      this.publish({
        ...this.telemetry(),
        phase: "filling",
        note: "Warming up",
        handsTracked,
      });
      return;
    }

    let tensor = processSequence(recent, frameCount);
    if (this.reflect) tensor = mirrorSequence(tensor, TARGET_LEN);

    const handsPresent = handsTracked >= MIN_TRACKED;
    const movement = frameMovement(tensor, TARGET_LEN, frameCount / TARGET_LEN);
    const wasActive = this.burst.active;
    const scoring = this.burst.observe(movement, handsPresent);

    if (scoring) {
      const modelStart = performance.now();
      const probabilities = await classifier.probabilities(tensor);
      record(this.modelTimes, performance.now() - modelStart);
      const smoothed = this.smoother.update(probabilities);
      this.burst.add(probabilities);
      this.publish({
        ...this.telemetry(),
        phase: "reading",
        note: "Reading your sign",
        candidates: ranked(smoothed, classifier, CANDIDATES_SHOWN),
        handsTracked,
        movement,
        burstFrames: this.burst.length,
      });
      return;
    }

    if (wasActive) {
      // The burst just ended: the hands stopped or left the frame.
      this.smoother.clear();
      const averaged = this.burst.take();
      if (averaged) {
        const candidates = ranked(averaged, classifier, CANDIDATES_SHOWN);
        const best = candidates[0];
        if (best.probability >= this.threshold) {
          const result: Result = {
            label: best.label,
            probability: best.probability,
            candidates,
            at: performance.now(),
          };
          this.publish({
            ...this.telemetry(),
            phase: "result",
            note: `${Math.round(best.probability * 100)}% confident`,
            candidates,
            result,
            handsTracked,
            movement,
            burstFrames: this.burst.length,
          });
          this.onWord?.(result);
          return;
        }
        this.publish({
          ...this.telemetry(),
          phase: "unclear",
          note: "Not clear enough to call — try again a little slower",
          candidates,
          handsTracked,
          movement,
          burstFrames: this.burst.length,
        });
        return;
      }
      this.publish({
        ...this.telemetry(),
        phase: "unclear",
        note: "Too brief to read as a sign",
        handsTracked,
        movement,
        burstFrames: this.burst.length,
      });
      return;
    }

    // Idle. Keep the last result/candidates on screen; only the phase moves.
    const idlePhase: Phase = handsPresent ? "waiting" : "no-hands";
    if (this.snapshot.phase === "result" || this.snapshot.phase === "unclear") {
      // Hold the verdict until the next burst begins, but let the UI know
      // whether hands are still in frame.
      this.publish({ ...this.telemetry(), handsTracked, movement });
      return;
    }
    this.publish({
      ...this.telemetry(),
      phase: idlePhase,
      note: handsPresent ? "Ready — sign a word" : "Show your hands to the camera",
      handsTracked,
      movement,
    });
  }

  private drawOverlay(frame: Float64Array, poseSeen: boolean): void {
    const context = this.overlay.getContext("2d");
    if (!context) return;
    const { width, height } = this.overlay;
    context.clearRect(0, 0, width, height);

    const point = (index: number): [number, number] | undefined => {
      const x = frame[index * NUM_COORDS];
      const y = frame[index * NUM_COORDS + 1];
      return Number.isNaN(x) || Number.isNaN(y) ? undefined : [x * width, y * height];
    };

    if (poseSeen) {
      const left = point(LEFT_SHOULDER);
      const right = point(RIGHT_SHOULDER);
      if (left && right) {
        context.strokeStyle = "rgba(255,255,255,0.18)";
        context.lineWidth = 2;
        context.setLineDash([6, 8]);
        context.beginPath();
        context.moveTo(left[0], left[1]);
        context.lineTo(right[0], right[1]);
        context.stroke();
        context.setLineDash([]);
      }
    }

    const scale = Math.max(1, width / 640);
    for (const start of [LEFT_HAND_START, RIGHT_HAND_START]) {
      const color = start === LEFT_HAND_START ? "#7fd8bf" : "#f0b264";
      context.strokeStyle = color;
      context.lineWidth = 2.5 * scale;
      context.lineCap = "round";
      context.shadowColor = color;
      context.shadowBlur = 12 * scale;
      context.beginPath();
      for (const [a, b] of HAND_BONES) {
        const from = point(start + a);
        const to = point(start + b);
        if (!from || !to) continue;
        context.moveTo(from[0], from[1]);
        context.lineTo(to[0], to[1]);
      }
      context.stroke();
      context.shadowBlur = 0;
      context.fillStyle = "#ffffff";
      for (let j = 0; j < 21; j++) {
        const p = point(start + j);
        if (!p) continue;
        context.beginPath();
        context.arc(p[0], p[1], 3 * scale, 0, Math.PI * 2);
        context.fill();
      }
    }
  }
}
