import type { ReactNode } from "react";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

export function PageShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid-ink min-h-screen">
      <div className="px-4 py-4 sm:px-10 sm:py-8 lg:px-12">
        <SiteNav tone="solid" />
      </div>

      <header className="px-4 pt-10 pb-8 sm:px-10 sm:pt-16 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs tracking-[0.28em] text-primary uppercase">{eyebrow}</p>
          <h1 className="font-display mt-4 max-w-3xl text-[2.25rem] leading-[1.05] tracking-tight sm:text-[3.5rem]">
            {title}
          </h1>
          {lede && (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-lg">
              {lede}
            </p>
          )}
        </div>
      </header>

      <main className="px-4 pb-20 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}
