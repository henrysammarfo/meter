import type { ReactNode } from "react";

export function PageHead({
  title,
  sub,
  action,
}: {
  title: string;
  sub: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{sub}</p>
      </div>
      {action}
    </header>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "signal" | "danger";
}) {
  return (
    <div className="panel rounded-xl p-4 sm:p-5">
      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">{label}</p>
      <p
        className={`font-display mt-2 text-2xl sm:text-3xl ${
          tone === "signal" ? "text-primary" : tone === "danger" ? "text-destructive" : ""
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel rounded-2xl p-4 sm:p-6 ${className}`}>
      <div className="mb-4">
        <h2 className="text-sm font-medium">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

const TONE: Record<string, string> = {
  paid: "bg-primary/15 text-primary",
  settled: "bg-primary/15 text-primary",
  live: "bg-primary/15 text-primary",
  active: "bg-primary/15 text-primary",
  open: "bg-muted text-muted-foreground",
  batched: "bg-muted text-muted-foreground",
  queue: "bg-muted text-muted-foreground",
  notify: "bg-muted text-muted-foreground",
  paused: "bg-muted text-muted-foreground",
  throttled: "bg-accent/20 text-foreground",
  failed: "bg-destructive/15 text-destructive",
  declined: "bg-destructive/15 text-destructive",
  suspended: "bg-destructive/15 text-destructive",
  block: "bg-destructive/15 text-destructive",
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${
        TONE[value] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {value}
    </span>
  );
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {head.map((h) => (
              <th
                key={h}
                className="px-4 pb-2.5 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, mono }: { children: ReactNode; mono?: boolean }) {
  return <td className={`px-4 py-3 ${mono ? "font-mono text-[12.5px]" : ""}`}>{children}</td>;
}
