import { Section, SectionHeading } from "./Section";
import { Timer, Layers, BarChart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Real lecturer quotes drop in here once collected. Until then the section
// carries factual capability proof only — no invented attribution.
const testimonials: { name: string; role: string; content: string }[] = [];

const proofPoints = [
  {
    label: "Five minutes before the lecture",
    body: "Paste a PDF, slide deck, Word document or URL and get a first draft of a pre-lecture check built only from that material. Refine it by chatting, or edit every question by hand.",
    icon: Timer,
    color: "text-orange-600"
  },
  {
    label: "One source, three formats",
    body: "The same material becomes a quiz, a flashcard deck and a matching game, so review activities do not have to be rebuilt from scratch each time.",
    icon: Layers,
    color: "text-rose-600"
  },
  {
    label: "Question-level cohort results",
    body: "See which questions the cohort missed and how responses spread across readiness bands, so the lecture can start on the gap instead of the assumption.",
    icon: BarChart,
    color: "text-emerald-600"
  },
];

export const TestimonialSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    setIsDesktop(window.innerWidth > 768);
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      // Clamp to stop movement when section hits the top of the viewport
      setOffset(Math.max(0, rect.top));
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getTransform = (index: number) => {
    if (!isDesktop) {
      // Simple fade up on mobile
      return `translateY(${Math.min(50, offset * 0.1)}px)`;
    }

    // On desktop, they fan out from the center
    // offset goes from ~1000 down to 0
    const scale = 1 - Math.min(0.05, offset * 0.0001);
    
    if (index === 0) {
      // Left card pushes right
      return `translateX(${Math.min(300, offset * 0.5)}px) scale(${scale})`;
    }
    if (index === 1) {
      // Center card stays X, moves slightly in Y
      return `translateY(${Math.min(100, offset * 0.15)}px) scale(${scale})`;
    }
    if (index === 2) {
      // Right card pushes left
      return `translateX(-${Math.min(300, offset * 0.5)}px) scale(${scale})`;
    }
    return "none";
  };

  const getZIndex = (index: number) => {
    if (index === 1) return 20;
    return 10;
  };

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
    <section ref={sectionRef} className="py-24 md:py-32 px-6 sm:px-8 max-w-6xl mx-auto overflow-hidden">
      <div className="text-center mb-20 relative z-30">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-orange-900/50 mb-6 block">
          What you get
        </span>
        <h2 className="font-display italic text-4xl md:text-5xl lg:text-6xl text-slate-900 mb-6 leading-[1.15]">
          What a single pre-lecture check gives you
        </h2>
        <p className="text-lg md:text-xl text-slate-800/70 leading-relaxed max-w-xl mx-auto font-medium">
          Built for the way lecturers actually prepare a session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
        {proofPoints.map((point, index) => (
          <div
            key={point.label}
            className="bg-[#fef9f3] border border-orange-900/10 rounded-[2rem] p-8 lg:p-10 transition-transform duration-75 ease-out shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
            style={{ 
              transform: getTransform(index),
              zIndex: getZIndex(index),
              willChange: "transform"
            }}
          >
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 border border-orange-900/5">
              <point.icon className={`w-7 h-7 ${point.color}`} strokeWidth={2} />
            </div>
            <h3 className="font-display text-xl lg:text-2xl leading-tight text-slate-900 mb-4">
              {point.label}
            </h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              {point.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialSection;
