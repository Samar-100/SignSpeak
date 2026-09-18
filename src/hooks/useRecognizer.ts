import { useCallback, useEffect, useRef, useState } from "react";
import { Recognizer, type Result, type Snapshot } from "../engine/recognizer";

/**
 * Owns one Recognizer bound to a video + overlay canvas. Starts on `start()`,
 * tears the camera down on unmount. Committed words accumulate in `words`.
 */
export function useRecognizer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const recognizerRef = useRef<Recognizer | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [words, setWords] = useState<Result[]>([]);
  const [threshold, setThresholdState] = useState(0.35);
  const [reflect, setReflectState] = useState(false);

  const start = useCallback(() => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay || recognizerRef.current) return;
    const recognizer = new Recognizer(video, overlay, {
      threshold,
      reflect,
      onWord: (result) => setWords((prev) => [...prev, result]),
    });
    recognizerRef.current = recognizer;
    recognizer.subscribe(setSnapshot);
    void recognizer.start();
  }, [threshold, reflect]);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
    recognizerRef.current = null;
    setSnapshot(null);
  }, []);

  const setThreshold = useCallback((value: number) => {
    setThresholdState(value);
    if (recognizerRef.current) recognizerRef.current.threshold = value;
  }, []);

  const setReflect = useCallback((value: boolean) => {
    setReflectState(value);
    if (recognizerRef.current) recognizerRef.current.reflect = value;
  }, []);

  const clearWords = useCallback(() => setWords([]), []);
  const undoWord = useCallback(() => setWords((prev) => prev.slice(0, -1)), []);

  useEffect(() => () => recognizerRef.current?.stop(), []);

  return {
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
  };
}
