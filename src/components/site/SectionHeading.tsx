import { cn } from "@/lib/utils";
import { Eyebrow } from "./Eyebrow";

type Props = {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  level?: 1 | 2 | 3;
};

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
  titleClassName,
  level = 2,
}: Props) {
  const Heading = (level === 1 ? "h1" : level === 2 ? "h2" : "h3") as
    | "h1"
    | "h2"
    | "h3";

  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Heading
        className={cn(
          "font-headline font-semibold tracking-tight text-foreground text-balance",
          eyebrow && "mt-4",
          level === 1 &&
            "text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05]",
          level === 2 &&
            "text-3xl sm:text-4xl md:text-5xl leading-[1.1]",
          level === 3 && "text-2xl sm:text-3xl leading-[1.15]",
          titleClassName
        )}
      >
        {title}
      </Heading>
      {lead && (
        <p className="mt-5 max-w-2xl text-base md:text-lg text-ink-soft leading-relaxed text-pretty">
          {lead}
        </p>
      )}
    </div>
  );
}
