import { useEffect } from "react";

const ICON_LINKS = [
  { rel: "icon", href: "/icons/meter.svg", type: "image/svg+xml" },
  { rel: "icon", href: "/icons/meter.ico", sizes: "any" },
  { rel: "shortcut icon", href: "/icons/meter.ico" },
  { rel: "apple-touch-icon", href: "/icons/meter-180.png" },
] as const;

/**
 * Chrome/Safari often cache /favicon.ico forever (including old Lovable marks).
 * Force icon links to the versioned /icons/meter.* paths on the client.
 */
export function ForceMeterFavicon() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    for (const node of Array.from(
      document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]'),
    )) {
      node.parentElement?.removeChild(node);
    }

    for (const spec of ICON_LINKS) {
      const link = document.createElement("link");
      link.rel = spec.rel;
      link.href = `${spec.href}?v=meter-2`;
      if ("type" in spec && spec.type) link.type = spec.type;
      if ("sizes" in spec && spec.sizes) link.setAttribute("sizes", spec.sizes);
      document.head.appendChild(link);
    }
  }, []);

  return null;
}
