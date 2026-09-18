import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Backdrop from "../components/Backdrop";
import Button from "../components/Button";
import HeroDemo from "../components/HeroDemo";
import Logo from "../components/Logo";
import Nav from "../components/Nav";
import Reveal from "../components/Reveal";

const ease = [0.16, 1, 0.3, 1] as const;

function Eyebrow({ children, tone = "mint" }: { children: React.ReactNode; tone?: "mint" | "amber" | "violet" }) {
  const t = { mint: "text-mint", amber: "text-amber", violet: "text-violet" }[tone];
  return (
    <span
      className={`inline-block rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] ${t} hairline`}
    >
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] overflow-x-clip">
      <Backdrop />
      <Nav />

      {/* ---------- Hero ---------- */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-24 pt-36 md:px-8 md:pt-44 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:pb-40">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease }}
          >
            <Eyebrow>Runs entirely in your browser</Eyebrow>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.1, ease }}
            className="mt-6 text-balance text-5xl font-bold leading-[1.02] tracking-[-0.03em] md:text-7xl lg:text-[5.5rem]"
          >
            Sign a word.
            <br />
            <span className="font-serif font-normal italic text-mist/80">Read it</span> instantly.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.25, ease }}
            className="mt-7 max-w-lg text-lg leading-relaxed text-mist/60"
          >
            SignSpeak watches your hands through the webcam and turns American Sign Language into
            text as you sign. No account, no upload, no waiting — just point the camera and go.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Button to="/translate" className="text-base">
              Start translating
            </Button>
            <a
              href="#how"
              className="rounded-full px-5 py-3 text-sm text-mist/60 transition-colors duration-500 ease-spring hover:text-mist"
            >
              How it works ↓
            </a>
          </motion.div>
          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-14 flex flex-wrap gap-x-10 gap-y-4 text-sm text-mist/50"
          >
            {[
              ["250", "signs"],
              ["~30", "frames / sec"],
              ["0", "bytes uploaded"],
              ["1.6 MB", "model"],
            ].map(([n, l]) => (
              <div key={l} className="flex items-baseline gap-2">
                <dt className="text-2xl font-semibold tabular-nums text-mist">{n}</dt>
                <dd>{l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60, rotate: 2, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, rotate: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, delay: 0.3, ease }}
        >
          <HeroDemo />
        </motion.div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-24 md:px-8 md:py-40">
        <Reveal className="max-w-2xl">
          <Eyebrow tone="violet">How it works</Eyebrow>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-[-0.02em] md:text-6xl">
            Three steps, all on your device.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <Card
              step="01"
              title="Track the hands"
              body="MediaPipe finds 21 landmarks on each hand and your shoulders, thirty times a second. That skeleton — not the video — is what gets analysed."
              tone="mint"
              visual={<SkeletonVisual />}
            />
          </Reveal>
          <Reveal delay={0.1} className="md:col-span-5">
            <Card
              step="02"
              title="Sense the sign"
              body="A sign starts when your hands move and ends when they settle. Only that burst is scored, so a held pose can't be mistaken for a word."
              tone="violet"
              visual={<BurstVisual />}
            />
          </Reveal>
          <Reveal delay={0.15} className="md:col-span-5">
            <Card
              step="03"
              title="Name the word"
              body="A small neural network trained on 94,000 recordings of 250 signs ranks the closest matches. You see the top guess and how sure it is."
              tone="amber"
              visual={<RankVisual />}
            />
          </Reveal>
          <Reveal delay={0.2} className="md:col-span-7">
            <div className="hairline flex h-full flex-col justify-between gap-8 rounded-[2rem] bg-gradient-to-br from-white/[0.05] to-transparent p-8 md:p-10">
              <div>
                <Eyebrow tone="mint">Private by design</Eyebrow>
                <h3 className="mt-5 text-balance text-2xl font-semibold tracking-tight md:text-3xl">
                  Your camera feed never leaves the tab.
                </h3>
                <p className="mt-4 max-w-md text-mist/60">
                  Hand tracking and the sign model both run as WebAssembly in your browser. There
                  is no server to send video to — turn off Wi-Fi after the page loads and it keeps
                  working.
                </p>
              </div>
              <Button to="/translate" variant="ghost" className="self-start">
                Try it now
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Vocabulary ---------- */}
      <Vocabulary />

      {/* ---------- Honesty ---------- */}
      <section className="relative mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-40">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <Eyebrow tone="amber">Straight talk</Eyebrow>
            <h2 className="mt-5 text-balance text-4xl font-bold tracking-[-0.02em] md:text-5xl">
              It's good, not magic.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-mist/60">
              On signers it has never seen, the model names the right word first time about{" "}
              <span className="text-mist">6 in 10</span> tries and has it in its top five{" "}
              <span className="text-mist">8 in 10</span>. Good lighting and a clear view of both
              hands make the biggest difference — most misses come from tracking, not the model.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col gap-3">
            {[
              ["Face the camera", "Shoulders in frame — that's how the model knows your scale."],
              ["Sign one word, then pause", "The pause is what tells it the sign is finished."],
              ["Keep hands in view", "If they drop out of frame mid-sign, the reading is discarded."],
              ["Check the runner-ups", "The second guess is right surprisingly often."],
            ].map(([t, b], i) => (
              <div
                key={t}
                className="hairline flex gap-5 rounded-[1.5rem] bg-white/[0.03] p-5 transition-colors duration-500 ease-spring hover:bg-white/[0.05]"
              >
                <span className="font-serif text-2xl italic text-mist/30">0{i + 1}</span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="mt-1 text-sm text-mist/55">{b}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="relative mx-auto max-w-7xl px-4 pb-24 md:px-8 md:pb-40">
        <Reveal>
          <div className="hairline relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] p-2">
            <div className="inner-glow relative flex flex-col items-center gap-8 rounded-[calc(2.5rem-0.5rem)] bg-ink-2 px-6 py-20 text-center md:py-28">
              <div className="orb pointer-events-none absolute -top-40 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 bg-mint/20" />
              <Logo className="relative h-12 w-12" />
              <h2 className="relative max-w-2xl text-balance text-4xl font-bold tracking-[-0.02em] md:text-6xl">
                Ready when your hands are.
              </h2>
              <p className="relative max-w-md text-mist/60">
                Allow the camera, sign a word, watch it appear. Takes about ten seconds to load.
              </p>
              <Button to="/translate" className="relative text-base">
                Start translating
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 pb-10 text-xs text-mist/40 md:px-8">
        <span className="flex items-center gap-2">
          <Logo className="h-4 w-4" /> SignSpeak
        </span>
        <span>
          Model trained on the Google Isolated Sign Language Recognition dataset · pipeline adapted
          from ash-sid/sign-recognition
        </span>
      </footer>
    </div>
  );
}

function Card({
  step,
  title,
  body,
  tone,
  visual,
}: {
  step: string;
  title: string;
  body: string;
  tone: "mint" | "violet" | "amber";
  visual: React.ReactNode;
}) {
  return (
    <div className="hairline h-full rounded-[2rem] bg-white/[0.03] p-2">
      <div className="inner-glow flex h-full flex-col rounded-[calc(2rem-0.5rem)] bg-ink-2 p-8 md:p-10">
        <div className="mb-8 flex items-center justify-between">
          <Eyebrow tone={tone}>Step {step}</Eyebrow>
        </div>
        <div className="mb-8 h-32">{visual}</div>
        <h3 className="text-2xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 text-mist/60">{body}</p>
      </div>
    </div>
  );
}

function SkeletonVisual() {
  const pts: [number, number][] = [
    [40, 110], [28, 90], [20, 70], [14, 52],
    [46, 70], [44, 46], [43, 26],
    [60, 68], [62, 40], [63, 18],
    [74, 72], [78, 46], [80, 26],
    [86, 82], [96, 62], [102, 46],
  ];
  const bones: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [4, 7], [7, 8], [8, 9], [7, 10], [10, 11],
    [11, 12], [10, 13], [13, 14], [14, 15], [0, 13],
  ];
  return (
    <svg viewBox="0 0 320 120" className="h-full w-full">
      {[0, 1, 2].map((k) => (
        <g key={k} transform={`translate(${k * 110}, 0)`} opacity={1 - k * 0.3}>
          <g stroke="#7fd8bf" strokeWidth="2" strokeLinecap="round">
            {bones.map(([a, b], i) => (
              <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} />
            ))}
          </g>
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill="#fff" />
          ))}
        </g>
      ))}
    </svg>
  );
}

function BurstVisual() {
  const bars = [4, 6, 5, 8, 26, 44, 58, 52, 61, 40, 22, 9, 5, 6, 4, 5];
  return (
    <div className="flex h-full items-end gap-1.5">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className={`flex-1 rounded-full ${h > 20 ? "bg-violet" : "bg-white/15"}`}
          initial={{ scaleY: 0.1 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: i * 0.04, ease }}
          style={{ height: `${h}%`, transformOrigin: "bottom" }}
        />
      ))}
    </div>
  );
}

function RankVisual() {
  const rows: [string, number][] = [
    ["hello", 71],
    ["bye", 12],
    ["wave", 6],
  ];
  return (
    <ol className="flex h-full flex-col justify-center gap-3">
      {rows.map(([w, p], i) => (
        <li key={w} className="flex items-center gap-3 text-sm">
          <span className={`w-14 ${i === 0 ? "font-semibold" : "text-mist/60"}`}>{w}</span>
          <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.span
              className={`absolute inset-y-0 left-0 rounded-full ${i === 0 ? "bg-amber" : "bg-mist/30"}`}
              initial={{ width: 0 }}
              whileInView={{ width: `${p}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 + i * 0.1, ease }}
            />
          </span>
          <span className="w-9 text-right tabular-nums text-mist/50">{p}%</span>
        </li>
      ))}
    </ol>
  );
}

function Vocabulary() {
  const [labels, setLabels] = useState<string[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    fetch("/models/labels.json")
      .then((r) => r.json())
      .then((l: string[]) => setLabels([...l].sort((a, b) => a.localeCompare(b))))
      .catch(() => {});
  }, []);
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? labels.filter((l) => l.toLowerCase().includes(n)) : labels;
  }, [labels, q]);

  return (
    <section id="vocab" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-24 md:px-8 md:py-40">
      <Reveal className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <Eyebrow>Vocabulary</Eyebrow>
          <h2 className="mt-5 text-balance text-4xl font-bold tracking-[-0.02em] md:text-6xl">
            {labels.length || 250} everyday signs.
          </h2>
          <p className="mt-5 text-mist/60">
            Family, food, animals, feelings, colours, the words a child learns first — the same
            vocabulary the PopSign learning app was built on.
          </p>
        </div>
        <label className="hairline flex items-center gap-3 rounded-full bg-white/[0.04] px-5 py-3 md:w-72">
          <svg viewBox="0 0 20 20" className="h-4 w-4 text-mist/50" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 3 3" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a word"
            className="w-full bg-transparent text-sm outline-none placeholder:text-mist/30"
          />
        </label>
      </Reveal>
      <Reveal delay={0.1} className="mt-12">
        <div className="hairline max-h-[26rem] overflow-y-auto rounded-[2rem] bg-white/[0.02] p-6 md:p-8">
          <div className="flex flex-wrap gap-2">
            {shown.map((l) => (
              <span
                key={l}
                className="rounded-full bg-white/[0.04] px-3.5 py-1.5 text-sm text-mist/75 transition-colors duration-500 ease-spring hover:bg-mint/15 hover:text-mist"
              >
                {l}
              </span>
            ))}
            {labels.length > 0 && shown.length === 0 && (
              <p className="font-serif text-xl italic text-mist/40">Not in the vocabulary yet.</p>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
