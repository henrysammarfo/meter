import { Link } from "@tanstack/react-router";
import { MeterMark } from "@/components/brand/MeterMark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-4 py-10 sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <MeterMark className="h-6 w-6 text-primary" />
          <span className="font-display text-sm tracking-[0.2em]">METER</span>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link to="/product" className="hover:text-foreground">Product</Link>
          <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          <Link to="/docs" className="hover:text-foreground">Docs</Link>
          <Link to="/demo" className="hover:text-foreground">Demo</Link>
          <Link to="/brand" className="hover:text-foreground">Brand kit</Link>
          <Link to="/merch" className="hover:text-foreground">Merch</Link>
          <Link to="/dashboard" className="hover:text-foreground">Ledger</Link>
        </div>
        <p className="text-xs text-muted-foreground">
          The ledger for agent money · Built on Binance Agent OS + x402
        </p>
      </div>
    </footer>
  );
}
