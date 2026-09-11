import { ReactNode } from "react";

export type SectionTone = "light" | "muted" | "band" | "transparent";

interface SectionProps {
  id?: string;
  tone?: SectionTone;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}

export const Section = ({
  id,
  tone = "light",
  className = "",
  containerClassName = "",
  children,
}: SectionProps) => {
  const toneClass =
    tone === "muted" ? "bg-secondary/40" : tone === "transparent" ? "" : tone === "light" ? "bg-background" : "";

  return (
    <section
      id={id}
      className={`${toneClass} py-20 md:py-28 ${className}`}
      style={tone === "band" ? { backgroundColor: "hsl(var(--hero-band))" } : undefined}
    >
      <div className={`max-w-6xl mx-auto px-6 sm:px-8 ${containerClassName}`}>{children}</div>
    </section>
  );
};

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  tone?: SectionTone;
  className?: string;
}

export const SectionHeading = ({
  eyebrow,
  title,
  description,
  tone = "light",
  className = "",
}: SectionHeadingProps) => {
  const onBand = tone === "band";

  return (
    <div className={`text-center max-w-2xl mx-auto mb-14 ${className}`}>
      {eyebrow && (
        <span
          className="block text-xs font-semibold uppercase tracking-[0.16em] mb-3"
          style={{ color: onBand ? "hsl(var(--hero-band-muted))" : undefined }}
        >
          <span className={onBand ? "" : "text-muted-foreground"}>{eyebrow}</span>
        </span>
      )}
      <h2
        className="font-display italic text-3xl md:text-5xl leading-[1.1]"
        style={{ color: onBand ? "hsl(var(--hero-band-foreground))" : "hsl(var(--foreground))" }}
      >
        {title}
      </h2>
      {description && (
        <p
          className="text-sm md:text-base leading-relaxed mt-4"
          style={{ color: onBand ? "hsl(var(--hero-band-muted))" : "hsl(var(--muted-foreground))" }}
        >
          {description}
        </p>
      )}
    </div>
  );
};

export default Section;
