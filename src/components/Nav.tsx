import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";

const linkCls =
  "hidden rounded-full px-4 py-2 text-sm text-mist/70 transition-colors duration-500 ease-spring hover:bg-white/[0.06] hover:text-mist sm:block";

export default function Nav() {
  const { pathname } = useLocation();
  const onTranslate = pathname === "/translate";
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex justify-center px-4 pt-5">
      <nav className="inner-glow flex w-max items-center gap-1 rounded-full bg-white/[0.04] p-1.5 backdrop-blur-2xl">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold tracking-tight transition-colors duration-500 ease-spring hover:bg-white/[0.06]"
        >
          <Logo className="h-5 w-5" />
          SignSpeak
        </Link>
        <span className="mx-1 hidden h-4 w-px bg-white/10 sm:block" />
        <a href="/#how" className={linkCls}>
          How it works
        </a>
        <a href="/#vocab" className={linkCls}>
          Vocabulary
        </a>
        {!onTranslate && (
          <Link
            to="/translate"
            className="ml-1 rounded-full bg-mist px-4 py-2 text-sm font-semibold text-ink transition-transform duration-500 ease-spring hover:scale-[1.03] active:scale-[0.98]"
          >
            Start
          </Link>
        )}
      </nav>
    </header>
  );
}
