import { cn } from "@/lib/utils";
import { type PropsWithChildren, type ElementType } from "react";

type Props = PropsWithChildren<{
  as?: ElementType;
  className?: string;
  size?: "default" | "narrow" | "wide";
}>;

const SIZES = {
  narrow: "max-w-4xl",
  default: "max-w-7xl",
  wide: "max-w-[1440px]",
} as const;

export function Container({
  as: Tag = "div",
  className,
  size = "default",
  children,
}: Props) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10",
        SIZES[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}
