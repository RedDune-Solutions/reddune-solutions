import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * Big typographic mark between services and portfolio — matches
 * `.big-mark` in `project/site/index.html` (Iuri handoff).
 */
export function BigMark() {
  const t = useTranslations("HomePage.BigMark");

  return (
    <Reveal>
      <div className="big-mark relative mx-auto w-full max-w-content text-center">
        <div
          className={cn(
            "word font-display font-extrabold leading-[0.88] tracking-[-0.05em]",
            "text-[clamp(60px,22vw,320px)]",
            "bg-clip-text text-transparent",
            "[&_em]:font-serif [&_em]:italic [&_em]:font-medium",
          )}
          style={{
            fontVariationSettings: '"opsz" 96',
            backgroundImage:
              "linear-gradient(180deg, var(--peach), var(--ember) 80%, var(--dune-deep))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {t.rich("phrase", {
            accent: (chunks) => <em>{chunks}</em>,
          })}
        </div>
      </div>
    </Reveal>
  );
}
