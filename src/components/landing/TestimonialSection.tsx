import { Section, SectionHeading } from "./Section";

// Real lecturer quotes drop in here once collected. Until then the section
// carries factual capability proof only — no invented attribution.
const testimonials: { name: string; role: string; content: string }[] = [];

const proofPoints = [
  {
    label: "Five minutes before the lecture",
    body: "Paste a PDF, slide deck, Word document or URL and get a first draft of a pre-lecture check built only from that material. Refine it by chatting, or edit every question by hand.",
  },
  {
    label: "One source, three activity formats",
    body: "The same material becomes a quiz, a flashcard deck and a matching game, so review activities do not have to be rebuilt from scratch each time.",
  },
  {
    label: "Question-level cohort results",
    body: "See which questions the cohort missed and how responses spread across readiness bands, so the lecture can start on the gap instead of the assumption.",
  },
];

export const TestimonialSection = () => {
  if (testimonials.length > 0) {
    return (
      <Section tone="transparent">
        <SectionHeading
          eyebrow="Lecturer voices"
          title="What lecturers say"
          description="How lecturers are using Quizabl before they teach."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12">
          {testimonials.map((testimonial, index) => (
            <figure
              key={testimonial.name}
              className="animate-fade-in border-t border-border pt-8"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <blockquote className="font-display text-xl md:text-2xl leading-snug text-foreground mb-6">
                “{testimonial.content}”
              </blockquote>
              <figcaption>
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                  {testimonial.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{testimonial.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section tone="transparent">
      <SectionHeading
        eyebrow="What you get"
        title="What a single pre-lecture check gives you"
        description="Built for the way lecturers actually prepare a session."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12">
        {proofPoints.map((point, index) => (
          <div
            key={point.label}
            className="animate-fade-in border-t border-border pt-8"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <h3 className="font-display text-xl md:text-2xl leading-snug text-foreground mb-4">
              {point.label}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{point.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};
