import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "primary" | "ghost";

type Base = {
  children: ReactNode;
  variant?: Variant;
  icon?: boolean;
  className?: string;
};

type AsLink = Base & { to: string } & Omit<ComponentProps<typeof Link>, "to" | "className">;
type AsButton = Base & { to?: undefined } & Omit<ComponentProps<"button">, "className">;

const base =
  "group relative inline-flex items-center gap-3 rounded-full font-semibold tracking-tight transition-all duration-500 ease-spring active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none";
const variants: Record<Variant, string> = {
  primary: "bg-mist text-ink pl-6 pr-2 py-2 hover:shadow-[0_0_0_6px_rgba(255,255,255,0.06)]",
  ghost: "bg-white/[0.04] text-mist inner-glow pl-5 pr-2 py-2 hover:bg-white/[0.08]",
};

function Arrow({ variant }: { variant: Variant }) {
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105 ${
        variant === "primary" ? "bg-ink/10" : "bg-white/10"
      }`}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12 12 4M6 4h6v6" />
      </svg>
    </span>
  );
}

export default function Button(props: AsLink | AsButton) {
  const { children, variant = "primary", icon = true, className = "" } = props;
  const cls = `${base} ${variants[variant]} ${icon ? "" : "pr-6"} ${className}`;
  if ("to" in props && props.to) {
    const { to, children: _c, variant: _v, icon: _i, className: _cl, ...rest } = props as AsLink;
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
        {icon && <Arrow variant={variant} />}
      </Link>
    );
  }
  const { children: _c, variant: _v, icon: _i, className: _cl, ...rest } = props as AsButton;
  return (
    <button className={cls} {...rest}>
      {children}
      {icon && <Arrow variant={variant} />}
    </button>
  );
}
