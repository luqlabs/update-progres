import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Section, SectionHeading } from "./Section";

const oldWay = [
  "Manual entry in the LMS",
  "Endless clicks and rigid forms",
  "Questions written from scratch",
  "Grades, but no idea where the gap is",
  "An evening lost per quiz",
];

const newWay = [
  "Describe it in chat, get a draft",
  "Edit every question by hand",
  "Built from your own lecture material",
  "Per-topic cohort gap analysis",
  "Ready in about five minutes",
];

export const MethodComparisonSection = ({ className = "" }: { className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible(true),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Section className={className} tone="transparent">
      <SectionHeading
        eyebrow="The difference"
        title="Stop fighting with forms. Start teaching."
        description="The difference between an evening of set-up and a few minutes of conversation."
      />

      <div ref={ref} className="grid md:grid-cols-2 gap-12 md:gap-0">
        <div className="md:pr-12">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-6">
            The old way
          </h3>
          <ul className="divide-y divide-border border-y border-border">
            {oldWay.map((item, i) => (
              <li
                key={item}
                className={`flex items-center gap-3 py-4 transition-all duration-700 ease-out ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                }`}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <X className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:pl-12 md:border-l md:border-border">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground mb-6">
            The Quizabl way
          </h3>
          <ul className="divide-y divide-border border-y border-border">
            {newWay.map((item, i) => (
              <li
                key={item}
                className={`flex items-center gap-3 py-4 transition-all duration-700 ease-out ${
                  visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
                }`}
                style={{ transitionDelay: `${i * 90 + 180}ms` }}
              >
                <Check className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--badge-bg))" }} />
                <span className="text-sm text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
};
