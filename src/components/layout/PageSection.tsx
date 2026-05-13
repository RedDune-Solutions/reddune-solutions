import { cn } from "@/lib/utils";
import { type PropsWithChildren } from "react";

type Bg = "default" | "muted" | "primary" | "ink" | "cream";
type PaddingY = "default" | "tight" | "spacious";

type Props = PropsWithChildren<{
  id?: string;
  className?: string;
  containerClassName?: string;
  bg?: Bg;
  paddingY?: PaddingY;
  fullBleed?: boolean;
}>;

const bgMap: Record<Bg, string> = {
  default: "bg-background",
  muted: "bg-secondary/50",
  primary: "bg-primary text-primary-foreground",
  ink: "bg-ink text-cream",
  cream: "bg-cream",
};

const paddingMap: Record<PaddingY, string> = {
  default: "py-16 md:py-24 lg:py-32",
  tight: "py-12 md:py-16",
  spacious: "py-24 md:py-32 lg:py-40",
};

export function PageSection({
  id,
  className,
  containerClassName,
  bg = "default",
  paddingY = "default",
  fullBleed = false,
  children,
}: Props) {
  return (
    <section
      id={id}
      className={cn(
        bgMap[bg],
        paddingMap[paddingY],
        "relative overflow-hidden",
        className
      )}
    >
      {fullBleed ? (
        children
      ) : (
        <div
          className={cn(
            "container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative",
            containerClassName
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}
