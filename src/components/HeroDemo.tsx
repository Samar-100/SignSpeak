import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/** Stylised hand skeleton, the same bones the tracker draws over the video. */
const POINTS: [number, number][] = [
  [100, 190], // 0 wrist
  [72, 168], [52, 140], [38, 118], [28, 98], // thumb
  [84, 120], [80, 86], [78, 60], [76, 38], // index
  [104, 116], [106, 78], [107, 50], [108, 26], // middle
  [124, 122], [130, 88], [134, 62], [137, 40], // ring
  [142, 134], [154, 108], [162, 88], [168, 70], // pinky
];
const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const WORDS = ["hello", "thank you", "happy", "mom", "drink", "book", "look", "home"];

export default function HeroDemo() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);
  const word = WORDS[i];
  const pct = 62 + ((i * 37) % 31);

  return (
    <div className="hairline rounded-[2rem] bg-white/[0.03] p-2">
      <div className="inner-glow relative overflow-hidden rounded-[calc(2rem-0.5rem)] bg-ink-2">
        {/* stage */}
        <div className="relative aspect-[4/3] bg-[radial-gradient(ellipse_at_60%_40%,rgba(127,216,191,0.10),transparent_60%)]">
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-ink/60 px-3 py-1.5 text-xs backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-violet" />
            <span className="text-violet">Reading</span>
          </div>
          <motion.svg
            viewBox="0 0 200 220"
            className="absolute inset-0 m-auto h-[78%] w-auto"
            animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g stroke="#7fd8bf" strokeWidth="2.4" strokeLinecap="round" fill="none" filter="url(#glow)">
              {BONES.map(([a, b], k) => (
                <motion.line
                  key={k}
                  x1={POINTS[a][0]}
                  y1={POINTS[a][1]}
                  x2={POINTS[b][0]}
                  y2={POINTS[b][1]}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 + k * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
            </g>
            {POINTS.map(([x, y], k) => (
              <motion.circle
                key={k}
                cx={x}
                cy={y}
                r="3"
                fill="#fff"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 + k * 0.04, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </motion.svg>
          <div className="absolute inset-x-0 bottom-0 h-0.5 shimmer" />
        </div>

        {/* readout */}
        <div className="flex items-end justify-between gap-6 border-t border-white/[0.06] px-6 py-5">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-mist/50">
              You signed
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={word}
                initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="truncate text-4xl font-bold tracking-tight"
              >
                {word}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-2xl font-semibold tabular-nums text-mint">{pct}%</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-mist/40">confidence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
