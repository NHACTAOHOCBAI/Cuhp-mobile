/**
 * Typography presets — NativeWind class strings usable as
 * `className={typography.h2}` on Text.
 *
 * Promote the recurring "eyebrow" / "body" / "heading" patterns so future
 * tone tweaks (font family, dark-mode adjustments) land in one file.
 *
 * Heuristic note: the codebase has two flavors of eyebrow text:
 *  - `text-xs font-bold uppercase tracking-widest`  → `eyebrow`
 *  - `text-[10px] font-bold uppercase tracking-wider` (smaller, tighter) → `eyebrowSm`
 */
export const typography = {
  display: 'text-3xl font-extrabold tracking-tight text-foreground',
  h1: 'text-2xl font-bold tracking-tight text-foreground',
  h2: 'text-xl font-bold text-foreground',
  h3: 'text-lg font-bold text-foreground',
  h4: 'text-base font-bold text-foreground',
  body: 'text-base text-foreground',
  bodySm: 'text-sm text-foreground',
  bodyMuted: 'text-sm text-muted-foreground leading-relaxed',
  bodyMutedSm: 'text-xs text-muted-foreground leading-relaxed',
  eyebrow: 'text-xs font-bold uppercase tracking-widest text-muted-foreground',
  eyebrowSm: 'text-[10px] font-bold uppercase tracking-wider text-muted-foreground',
  displayInverse: 'text-3xl font-black text-foreground',
} as const;

export type TypographyPreset = keyof typeof typography;
