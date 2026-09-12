import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
    <section className={`py-20 md:py-32 px-6 sm:px-8 max-w-5xl mx-auto ${className}`}>
      <div className="text-center mb-16">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600/80 mb-4 block">
          The difference
        </span>
        <h2 className="font-display text-4xl md:text-5xl text-slate-900 mb-6 leading-tight">
          Stop fighting with forms.<br />Start teaching.
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          The difference between an evening of set-up and a few minutes of conversation.
        </p>
      </div>

      <div ref={ref} className="grid md:grid-cols-2 gap-8 md:gap-0 relative max-w-4xl mx-auto items-center">
        
        {/* The Old Way Card */}
        <div 
          className={`bg-slate-200/50 rounded-[2rem] p-8 md:p-10 md:pr-16 relative transition-all duration-1000 ease-out ${
            visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          }`}
        >
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500 mb-8">
            The old way
          </h3>
          <ul className="space-y-6">
            {oldWay.map((item, i) => (
              <li
                key={item}
                className={`flex items-start gap-4 transition-all duration-700 ease-out ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="w-6 h-6 shrink-0 rounded-full bg-slate-300/50 flex items-center justify-center mt-0.5">
                  <X className="w-3.5 h-3.5 text-slate-500" strokeWidth={3} />
                </div>
                <span className="text-[15px] font-medium text-slate-600 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* The Quizabl Way Card (Floating 3D Effect) */}
        <div 
          className={`bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] relative z-10 md:-ml-8 transition-all duration-1000 delay-300 ease-out ${
            visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
          }`}
        >
          {/* Subtle colorful glow at the top edge */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-t-[2rem]"></div>
          
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-600 mb-8 mt-2">
            The Quizabl way
          </h3>
          <ul className="space-y-6">
            {newWay.map((item, i) => (
              <li
                key={item}
                className={`flex items-start gap-4 transition-all duration-700 ease-out ${
                  visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                }`}
                style={{ transitionDelay: `${(i * 100) + 400}ms` }}
              >
                <div className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center mt-0.5 shadow-sm">
                  <Check className="w-3.5 h-3.5 text-indigo-600" strokeWidth={3} />
                </div>
                <span className="text-[15px] font-bold text-slate-800 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </section>
  );
};

export default MethodComparisonSection;
