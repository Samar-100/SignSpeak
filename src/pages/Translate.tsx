import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Backdrop from "../components/Backdrop";
import Button from "../components/Button";
import Nav from "../components/Nav";
import type { Phase, Snapshot } from "../engine/recognizer";
import { useRecognizer } from "../hooks/useRecognizer";

const PHASE_LABEL: Record<Phase, string> = {
  filling: "Warming up",
  "no-hands": "No hands",
  waiting: "Ready",
  reading: "Reading",
  result: "Recognised",
  unclear: "Unclear",
};

const PHASE_TONE: Record<Phase, string> = {
  filling: "text-mist/60",
  "no-hands": "text-amber",
  waiting: "text-mint",
  reading: "text-violet",
  result: "text-mint",
  unclear: "text-amber",
};

function pretty(label: string): string {
  // Dataset glosses are lowercase, sometimes compound: "frenchfries", "callonphone".
  const map: Record<string, string> = {
    frenchfries: "french fries",
    callonphone: "call on phone",
    glasswindow: "glass window",
    hesheit: "he / she / it",
    minemy: "mine / my",
    haveto: "have to",
    icecream: "ice cream",
    thankyou: "thank you",
    TV: "TV",
  };
  return map[label] ?? label;
}

export default function Translate() {
  const {
    videoRef,
    overlayRef,
    snapshot,
    words,
    start,
    stop,
    clearWords,
    undoWord,
    threshold,
    setThreshold,
    reflect,
    setReflect,
  } = useRecognizer();
  const [speak, setSpeak] = useState(false);
  const [copied, setCopied] = useState(false);
  const spokenCount = useRef(0);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const status = snapshot?.status ?? "idle";
  const live = status === "live";
  const busy = status === "loading" || status === "camera";

  // Speak newly committed words if enabled.
  useEffect(() => {
    if (!speak) {
      spokenCount.current = words.length;
      return;
    }
    const fresh = words.slice(spokenCount.current);
    spokenCount.current = words.length;
    for (const w of fresh) {
      const utterance = new SpeechSynthesisUtterance(pretty(w.label));
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, [words, speak]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ left: transcriptRef.current.scrollWidth, behavior: "smooth" });
  }, [words.length]);

  const copy = async () => {
    await navigator.clipboard.writeText(words.map((w) => pretty(w.label)).join(" "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="relative min-h-[100dvh]">
      <Backdrop dim />
      <Nav />

      <main className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 md:px-8 md:pt-32">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]">
          {/* ---------- Stage ---------- */}
          <section className="flex flex-col gap-6">
            <div className="hairline rounded-[2rem] bg-white/[0.03] p-2">
              <div className="inner-glow relative aspect-[4/5] overflow-hidden rounded-[calc(2rem-0.5rem)] bg-ink-2 sm:aspect-video">
                {/* Video + overlay, mirrored together so the signer sees a reflection.
                    The model receives the un-mirrored frame. */}
                <div className="absolute inset-0 -scale-x-100">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`h-full w-full object-cover transition-opacity duration-700 ease-spring ${
                      live ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <canvas ref={overlayRef} className="absolute inset-0 h-full w-full object-cover" />
                </div>

                {/* Idle / loading / error states */}
                <AnimatePresence>
                  {!live && (
                    <motion.div
                      key={status}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-6 text-center"
                    >
                      {status === "error" ? (
                        <>
                          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-amber">
                            Couldn't start
                          </p>
                          <p className="max-w-sm text-sm text-mist/70">{snapshot?.error}</p>
                          <Button
                            onClick={() => {
                              stop();
                              setTimeout(start, 50);
                            }}
                            variant="ghost"
                          >
                            Try again
                          </Button>
                        </>
                      ) : busy ? (
                        <>
                          <span className="pulse-ring relative flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-mint">
                            <span className="h-2.5 w-2.5 rounded-full bg-mint" />
                          </span>
                          <p className="text-sm text-mist/70">{snapshot?.note}</p>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-mist/50">
                            Camera off
                          </span>
                          <h2 className="max-w-md text-balance text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
                            Turn on your camera and sign a word.
                          </h2>
                          <p className="max-w-sm text-sm text-mist/60">
                            Everything runs in your browser. No video leaves your device.
                          </p>
                          <Button onClick={start}>Start camera</Button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Live status chip */}
                {live && snapshot && (
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-ink/60 px-3 py-1.5 text-xs backdrop-blur-xl">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        snapshot.phase === "reading"
                          ? "bg-violet"
                          : snapshot.phase === "no-hands"
                            ? "bg-amber"
                            : "bg-mint"
                      }`}
                    />
                    <span className={PHASE_TONE[snapshot.phase]}>{PHASE_LABEL[snapshot.phase]}</span>
                  </div>
                )}

                {live && (
                  <button
                    onClick={stop}
                    className="absolute right-4 top-4 rounded-full bg-ink/60 px-3 py-1.5 text-xs text-mist/70 backdrop-blur-xl transition-colors duration-500 ease-spring hover:text-mist"
                  >
                    Stop
                  </button>
                )}

                {/* Reading progress bar */}
                {live && snapshot?.phase === "reading" && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 shimmer" />
                )}
              </div>
            </div>

            {/* ---------- Word readout ---------- */}
            <WordReadout snapshot={snapshot} />
          </section>

          {/* ---------- Side panel ---------- */}
          <aside className="flex flex-col gap-6">
            {/* Transcript */}
            <div className="hairline rounded-[2rem] bg-white/[0.03] p-2">
              <div className="inner-glow rounded-[calc(2rem-0.5rem)] bg-ink-2 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-mist/50">
                    Translation
                  </p>
                  <div className="flex gap-1">
                    <IconButton label="Undo" onClick={undoWord} disabled={!words.length}>
                      <path d="M4 7h7a4 4 0 0 1 0 8H8M4 7l3-3M4 7l3 3" />
                    </IconButton>
                    <IconButton label="Clear" onClick={clearWords} disabled={!words.length}>
                      <path d="M4 5h12M8 5V3h4v2M6 5l1 11h6l1-11" />
                    </IconButton>
                    <IconButton label={copied ? "Copied" : "Copy"} onClick={copy} disabled={!words.length}>
                      {copied ? (
                        <path d="M4 10l4 4 8-8" />
                      ) : (
                        <>
                          <rect x="7" y="7" width="9" height="9" rx="2" />
                          <path d="M4 12V5a1 1 0 0 1 1-1h7" />
                        </>
                      )}
                    </IconButton>
                  </div>
                </div>
                <div ref={transcriptRef} className="min-h-[5.5rem]">
                  {words.length === 0 ? (
                    <p className="font-serif text-2xl italic text-mist/30">
                      Your words will appear here…
                    </p>
                  ) : (
                    <p className="text-2xl font-medium leading-relaxed tracking-tight">
                      {words.map((w, i) => (
                        <motion.span
                          key={w.at}
                          initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="inline-block"
                        >
                          {pretty(w.label)}
                          {i < words.length - 1 ? " " : ""}
                        </motion.span>
                      ))}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Candidates */}
            <div className="hairline rounded-[2rem] bg-white/[0.03] p-2">
              <div className="inner-glow rounded-[calc(2rem-0.5rem)] bg-ink-2 p-6">
                <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-mist/50">
                  Closest signs
                </p>
                <ol className="flex flex-col gap-2.5">
                  {(snapshot?.candidates.length ? snapshot.candidates : Array(5).fill(null)).map(
                    (c, i) => (
                      <li key={c ? c.label : i} className="flex items-center gap-3 text-sm">
                        <span className="w-4 text-right text-xs tabular-nums text-mist/30">{i + 1}</span>
                        <span className={`w-28 truncate ${i === 0 ? "font-semibold" : "text-mist/70"}`}>
                          {c ? pretty(c.label) : "—"}
                        </span>
                        <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                          <motion.span
                            className={`absolute inset-y-0 left-0 rounded-full ${i === 0 ? "bg-mint" : "bg-mist/30"}`}
                            animate={{ width: `${c ? c.probability * 100 : 0}%` }}
                            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                          />
                        </span>
                        <span className="w-10 text-right text-xs tabular-nums text-mist/50">
                          {c ? `${Math.round(c.probability * 100)}%` : ""}
                        </span>
                      </li>
                    ),
                  )}
                </ol>
              </div>
            </div>

            {/* Settings */}
            <div className="hairline rounded-[2rem] bg-white/[0.03] p-2">
              <div className="inner-glow rounded-[calc(2rem-0.5rem)] bg-ink-2 p-6">
                <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-mist/50">
                  Settings
                </p>
                <div className="flex flex-col gap-5">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="flex justify-between">
                      <span className="text-mist/70">Confidence needed</span>
                      <span className="tabular-nums">{Math.round(threshold * 100)}%</span>
                    </span>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={Math.round(threshold * 100)}
                      onChange={(e) => setThreshold(Number(e.target.value) / 100)}
                      className="accent-mint"
                    />
                  </label>
                  <Toggle label="Speak words aloud" checked={speak} onChange={setSpeak} />
                  <Toggle
                    label="Mirror hands (if signs read swapped)"
                    checked={reflect}
                    onChange={setReflect}
                  />
                </div>
              </div>
            </div>

            {/* Telemetry */}
            {live && snapshot && (
              <div className="grid grid-cols-3 gap-2 px-2 text-[11px] text-mist/40">
                <Stat label="fps" value={snapshot.fps.toFixed(0)} />
                <Stat label="tracking" value={`${snapshot.landmarkMs.toFixed(0)} ms`} />
                <Stat label="model" value={`${snapshot.modelMs.toFixed(1)} ms`} />
                <Stat label="hands" value={`${Math.round(snapshot.handsTracked * 100)}%`} />
                <Stat label="motion" value={snapshot.movement.toFixed(3)} />
                <Stat label="vocab" value={`${snapshot.vocabulary} signs`} />
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function WordReadout({ snapshot }: { snapshot: Snapshot | null }) {
  const phase = snapshot?.phase;
  const result = snapshot?.result;
  const showResult = phase === "result" && result;

  return (
    <div className="hairline rounded-[2rem] bg-white/[0.03] p-2">
      <div className="inner-glow flex min-h-[9rem] items-center justify-between gap-6 rounded-[calc(2rem-0.5rem)] bg-ink-2 px-8 py-6">
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-mist/50">
            {showResult ? "You signed" : "Current sign"}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={showResult ? `${result.label}-${result.at}` : phase ?? "idle"}
              initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`truncate text-4xl font-bold tracking-tight md:text-6xl ${
                showResult ? "text-mist" : "font-serif font-normal italic text-mist/35"
              }`}
            >
              {showResult
                ? pretty(result.label)
                : phase === "reading"
                  ? "reading…"
                  : phase === "unclear"
                    ? "not sure"
                    : "—"}
            </motion.p>
          </AnimatePresence>
          <p className="mt-2 text-sm text-mist/50">{snapshot?.note ?? "Camera is off"}</p>
        </div>
        {showResult && (
          <div className="hidden shrink-0 flex-col items-end sm:flex">
            <span className="text-3xl font-semibold tabular-nums text-mint">
              {Math.round(result.probability * 100)}%
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-mist/40">confidence</span>
          </div>
        )}
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-full text-mist/60 transition-all duration-500 ease-spring hover:bg-white/[0.06] hover:text-mist active:scale-95 disabled:opacity-30"
    >
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-4 text-left text-sm text-mist/70"
    >
      <span>{label}</span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-500 ease-spring ${
          checked ? "bg-mint" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-mist transition-transform duration-500 ease-spring ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between rounded-full bg-white/[0.03] px-3 py-1.5">
      <span>{label}</span>
      <span className="tabular-nums text-mist/60">{value}</span>
    </div>
  );
}
