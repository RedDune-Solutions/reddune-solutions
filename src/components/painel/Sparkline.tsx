type Props = {
  data?: number[];
  color?: string;
  w?: number;
  h?: number;
  className?: string;
};

/**
 * Sparkline — minimal inline-SVG trend line. Ported from the Oasis design
 * handoff (atoms.jsx). Decorative; pass real series when available.
 */
export function Sparkline({
  data = [3, 6, 5, 8, 7, 11, 9, 14, 12, 16],
  color = "var(--ember)",
  w = 90,
  h = 32,
  className,
}: Props) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const step = w / (data.length - 1);
  const pts = data
    .map((v, i) => `${i * step},${h - ((v - min) / (max - min || 1)) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg className={className} width={w} height={h} style={{ overflow: "visible" }} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
