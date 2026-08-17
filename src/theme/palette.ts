/**
 * Semantic palette access point.
 *
 * SOURCE OF TRUTH for hex color tokens in native props (lucide icons,
 * ActivityIndicator, Switch trackColor/thumbColor, RefreshControl.tintColor,
 * inline style.backgroundColor where className isn't accepted).
 *
 * The literal hex values mirror the `--color-*` variables in
 * `/home/aipowervn/Desktop/Cuhp/mobile/global.css` under the `@theme` block.
 * Keep these two files in sync; see `colors.ts` for the asserted record.
 *
 * The `getColor` signature accepts an optional `scheme` so a dark-mode flip
 * can be added later without touching screens.
 */

import { Colors, type ColorKey } from './colors';

export type ColorScheme = 'light';

const LIGHT: Record<ColorKey, string> = Colors;

/**
 * Resolve a token to its current-scheme hex value.
 * Today: always returns light. Add `dark: { ... }` + useColorScheme() later.
 */
export function getColor(name: ColorKey, _scheme: ColorScheme = 'light'): string {
  return LIGHT[name];
}

/**
 * Grouped palette — useful for UI that wants to traverse by category
 * (semantic surface, brand accents, on-dark text, brand off-axis).
 * Today these views just defer to `Colors`.
 */
export const semanticSurface = {
  background: Colors.background,
  foreground: Colors.foreground,
  card: Colors.card,
  cardForeground: Colors.cardForeground,
  popover: Colors.popover,
  popoverForeground: Colors.popoverForeground,
  muted: Colors.muted,
  mutedForeground: Colors.mutedForeground,
  border: Colors.border,
  input: Colors.input,
  ring: Colors.ring,
} as const;

export const semanticAccent = {
  primary: Colors.primary,
  primaryForeground: Colors.primaryForeground,
  secondary: Colors.secondary,
  secondaryForeground: Colors.secondaryForeground,
  accent: Colors.accent,
  accentForeground: Colors.accentForeground,
  destructive: Colors.destructive,
  destructiveForeground: Colors.destructiveForeground,
} as const;

export const brandMicroTints = {
  success: Colors.success,
  successForeground: Colors.successForeground,
  warning: Colors.warning,
  warningForeground: Colors.warningForeground,
  streak: Colors.streak,
  streakSoft: Colors.streakSoft,
  streakBorder: Colors.streakBorder,
  streakForeground: Colors.streakForeground,
  onDark: Colors.onDark,
  iconMuted: Colors.iconMuted,
  iconSubtle: Colors.iconSubtle,
  trackOff: Colors.trackOff,
} as const;

export const brandOffAxis = {
  purple: Colors.purple,
  gold: Colors.gold,
} as const;
