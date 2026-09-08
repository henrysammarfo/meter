// Shared Vite/TanStack Start config already includes TanStack Start, React,
// Tailwind, path aliases, Nitro, and env injection — do not duplicate those plugins.
// Additional overrides go under defineConfig({ vite: { ... } }).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
});
