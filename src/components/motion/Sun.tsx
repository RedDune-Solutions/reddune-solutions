import { type CSSProperties } from "react";

type Props = {
  /**
   * Visual size variant. `lg` (default) matches the 520x520 hero sun in the
   * design handoff. `sm` is a 320x320 variant suited to inner sections.
   */
  size?: "lg" | "sm";
  className?: string;
};

/**
 * Sun — soft radial glow disc that gently floats via the `sunfloat` CSS
 * keyframe (see `globals.css`). Pure server component: no JS shipped.
 *
 * The `.sun` class in `globals.css` owns the positioning and animation; this
 * component only chooses a size variant.
 */
export function Sun({ size = "lg", className }: Props) {
  const dimension = size === "lg" ? 520 : 320;
  const style: CSSProperties = {
    width: dimension,
    height: dimension,
  };

  const composed = ["sun", `sun-${size}`, className].filter(Boolean).join(" ");

  return <div aria-hidden="true" className={composed} style={style} />;
}

export default Sun;
