// Original line illustrations for the quick-check funnel (one consistent 48px stroke style).
import type { ReactNode } from "react";

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-primary shrink-0">
    {children}
  </svg>
);

export const FUNNEL_ICONS: Record<string, ReactNode> = {
  first: <Svg><path d="M8 22 24 9l16 13" /><path d="M12 19v20h24V19" /><path d="M21 39V29h6v10" /><circle cx="35" cy="11" r="3" /></Svg>,
  upgrade: <Svg><path d="M5 26 15 18l10 8" /><path d="M8 24v14h14V24" /><path d="M23 20 33 11l10 9" /><path d="M26 18v20h14V18" /><path d="M30 6l3-3 3 3" /></Svg>,
  refi: <Svg><path d="M10 22 24 10l14 12" /><path d="M14 19v19h20V19" /><path d="M19 30a5 5 0 0 1 9-3" /><path d="M29 24v4h-4" /><path d="M29 31a5 5 0 0 1-9 3" /></Svg>,
  now: <Svg><circle cx="24" cy="26" r="15" /><path d="M24 18v8l5 4" /><path d="M20 6h8" /></Svg>,
  "3m": <Svg><rect x="8" y="11" width="32" height="29" rx="3" /><path d="M8 19h32M16 7v8M32 7v8" /><path d="M15 27h4M22 27h4M29 27h4M15 33h4" /></Svg>,
  later: <Svg><rect x="8" y="11" width="32" height="29" rx="3" /><path d="M8 19h32M16 7v8M32 7v8" /><path d="M20 30h8M26 26l3 4-3 4" /></Svg>,
  unknown: <Svg><circle cx="24" cy="24" r="16" /><path d="M19 19a5 5 0 1 1 7 4.6c-1.3.6-2 1.6-2 3V28" /><circle cx="24" cy="33" r="0.8" fill="currentColor" /></Svg>,
  apartment: <Svg><rect x="12" y="6" width="24" height="36" rx="2" /><path d="M18 13h3M27 13h3M18 20h3M27 20h3M18 27h3M27 27h3" /><path d="M21 42v-7h6v7" /></Svg>,
  house: <Svg><path d="M6 24 24 9l18 15" /><path d="M11 20v20h26V20" /><rect x="17" y="27" width="6" height="6" /><path d="M28 40v-9h5v9" /></Svg>,
  new_build: <Svg><path d="M10 42V18h16v24" /><path d="M14 23h3M19 23h3M14 29h3M19 29h3" /><path d="M30 42V10" /><path d="M30 10h12M38 10v8" /><path d="M6 42h36" /></Svg>,
  b1: <Svg><circle cx="24" cy="16" r="7" /><path d="M11 40c1.5-8 7-12 13-12s11.5 4 13 12" /></Svg>,
  b2: <Svg><circle cx="17" cy="17" r="6" /><circle cx="32" cy="17" r="6" /><path d="M6 39c1-7 5.5-10 11-10s10 3 11 10" /><path d="M24 33c1.6-2.5 4.4-4 8-4 5.5 0 10 3 11 10" /></Svg>,
  b3: <Svg><circle cx="13" cy="19" r="5" /><circle cx="24" cy="15" r="6" /><circle cx="35" cy="19" r="5" /><path d="M4 38c.8-5 4.3-8 9-8M44 38c-.8-5-4.3-8-9-8" /><path d="M14 40c1-6 5.2-9 10-9s9 3 10 9" /></Svg>,
};
