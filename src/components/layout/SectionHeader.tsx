import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  level?: 2 | 3;
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  titleClassName,
  level = 2,
}: Props) {
  const Heading = (level === 2 ? "h2" : "h3") as "h2" | "h3";
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        align === "left" && "text-left",
        className
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-accent">
          <span className="block h-px w-8 bg-accent" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <Heading
        className={cn(
          "font-headline text-3xl md:text-4xl lg:text-5xl font-semibold leading-[1.05] tracking-tight mt-4",
          titleClassName
        )}
      >
        {title}
      </Heading>
      {subtitle && (
        <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
