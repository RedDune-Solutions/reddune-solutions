/**
 * Oasis chart theme — categorical palette + axis/grid styling for Recharts.
 *
 * Use these named exports across charts so the painel keeps a coherent warm
 * Oasis look instead of relying on shadcn `--chart-N` tokens (which were
 * tuned for the v4 palette).
 *
 * Colour rationale (mirrors design-handoff/project/site/styles.css):
 *   ember     — primary categorical accent (kicker red)
 *   apricot   — secondary warm orange
 *   dune      — deep brick (heavy emphasis)
 *   dune-deep — burgundy (extreme emphasis)
 *   peach     — light warm wash (mid value)
 *   ink-mute  — neutral warm grey (low emphasis / "outros")
 */

export const oasisChartPalette = [
  "#d6422a", // ember
  "#e89968", // apricot
  "#a8201a", // dune
  "#5a0e0e", // dune-deep
  "#f3c79b", // peach
  "#8c7563", // ink-mute
] as const;

export const oasisChartTheme = {
  grid: "rgba(90, 14, 14, 0.08)",
  axisLine: "rgba(90, 14, 14, 0.2)",
  text: "#4d2d22",
  background: "#fff7e8",
  // Hover / active state for bar cursor highlights
  cursor: "rgba(214, 66, 42, 0.08)",
  // Tooltip surface — sand-warm with subtle warm border
  tooltipBg: "#faf4e3",
  tooltipBorder: "rgba(90, 14, 14, 0.16)",
} as const;

/**
 * Status → semantic chart colour. Mirrors StatusBadge mapping so a status
 * looks identical in a pie slice and on a badge.
 *
 * Note: `pronto` stays emerald (semantic green-for-done is recognisable
 * worldwide and survives the Oasis re-skin).
 */
export const oasisStatusColors = {
  "em-curso": "#d6422a",   // ember
  proximo: "#e89968",       // apricot
  aguardando: "#f3c79b",    // peach
  terminado: "#f59e0b",     // amber-500 (alerta — falta pagar)
  fechado: "#059669",       // emerald-600 (pago)
  cancelado: "#8c7563",     // ink-mute
} as const;

export type OasisStatusKey = keyof typeof oasisStatusColors;
