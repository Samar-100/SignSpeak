/** Radial mesh orbs behind a page. Fixed and inert. */
export default function Backdrop({ dim = false }: { dim?: boolean }) {
  const o = dim ? 0.35 : 0.6;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div
        className="orb orb-drift -top-40 -left-32 h-[36rem] w-[36rem]"
        style={{ background: `rgba(127,216,191,${o * 0.5})` }}
      />
      <div
        className="orb orb-drift-slow top-1/3 -right-40 h-[40rem] w-[40rem]"
        style={{ background: `rgba(139,124,246,${o * 0.45})` }}
      />
      <div
        className="orb orb-drift bottom-[-12rem] left-1/3 h-[30rem] w-[30rem]"
        style={{ background: `rgba(240,178,100,${o * 0.3})` }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#050505_100%)]" />
    </div>
  );
}
