import { cn } from "@/lib/utils";
import { type PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  className?: string;
  withLine?: boolean;
  tone?: "primary" | "muted";
}>;

export function Eyebrow({
  children,
  className,
  withLine = true,
  tone = "primary",
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em]",
        tone === "primary" ? "text-primary" : "text-muted-foreground",
        className
      )}
    >
      {withLine && (
        <span
          className={cn(
            "block h-px w-6",
            tone === "primary" ? "bg-primary" : "bg-muted-foreground/60"
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
