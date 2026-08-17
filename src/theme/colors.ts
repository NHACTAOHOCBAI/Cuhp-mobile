/**
 * Hex color constants for native-only props.
 *
 * SOURCE OF TRUTH — mirror to /home/aipowervn/Desktop/Cuhp/mobile/global.css
 * @theme block. Use these for:
 *  - lucide-react-native icon `color` prop
 *  - ActivityIndicator.color
 *  - Switch.trackColor / thumbColor
 *  - RefreshControl.tintColor / colors
 *  - inline `style={{ backgroundColor }}` where className isn't accepted
 *
 * For className styling, prefer the semantic NativeWind utilities
 * (bg-primary, text-foreground, border-border, etc.) so tokens stay
 * in sync via the @theme block.
 *
 * Grouped sections:
 *  - semantic surface       — colors the app's surface tokens
 *  - semantic accent        — primary/secondary/destructive variants
 *  - brand micro-tints      — success/warning/streak/on-dark/icon helpers
 *  - brand identity off-axis — purple, gold kept off the navy axis
 */
export const Colors = {
  // --- semantic surface ---
  background: '#ffffff',
  foreground: '#193665',
  card: '#ffffff',
  cardForeground: '#193665',
  popover: '#ffffff',
  popoverForeground: '#193665',
  primary: '#76baf9',
  primaryForeground: '#193665',
  secondary: '#5c8edf',
  secondaryForeground: '#ffffff',
  muted: '#c2e6fb33',
  mutedForeground: '#193665cc',
  accent: '#5c8edf',
  accentForeground: '#ffffff',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  border: '#1936651a',
  input: '#1936651a',
  ring: '#76baf9',

  // Brand micro-tints
  success: '#22c55e',
  successForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#193665',
  streak: '#f97316',
  streakSoft: '#fff7ed',
  streakBorder: '#fed7aa',
  streakForeground: '#9a3412',
  onDark: '#c2e6fb',
  iconMuted: '#19366599',
  iconSubtle: '#19366566',
  trackOff: '#1936651a',

  // Brand identity colors kept off the navy axis
  purple: '#a855f7',
  gold: '#eab308',
} as const;

export type ColorKey = keyof typeof Colors;

/**
 * Dev-only assertion that surfaces drift between this file and the
 * `global.css` `@theme` block. Today the CSS mirror is hand-maintained, so
 * this helper exists to document the contract and trip a console warning
 * if the literal maps diverge from `expectedHex`.
 *
 * Pass `{ key: '#xxxxxx' }` pairs to compare; missing or mismatched
 * entries are listed. No-op in production.
 */
export function assertInSync(
  expectedHex: Partial<Record<ColorKey, string>>
): { ok: true } | { ok: false; mismatches: ColorKey[] } {
  if (!__DEV__) return { ok: true };
  const mismatches: ColorKey[] = [];
  (Object.keys(expectedHex) as ColorKey[]).forEach((key) => {
    if (Colors[key] !== expectedHex[key]) {
      mismatches.push(key);
    }
  });
  return mismatches.length === 0
    ? { ok: true }
    : { ok: false, mismatches };
}