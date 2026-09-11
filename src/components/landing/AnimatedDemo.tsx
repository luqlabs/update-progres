import { useEffect, useState } from "react";
import { Send, Sparkles, CheckCircle2, TrendingDown, Clock, BarChart2, Link as LinkIcon } from "lucide-react";

const SCRIPT = [
  { at: 0, kind: "user", text: "Create a 5-question pre-lecture activity from my lecture notes on mental health." },
  { at: 1, kind: "thinking", text: "Reading your material…" },
  { at: 2, kind: "ai", text: "Done — 5 questions, mixed difficulty. Want hints added?" },
  { at: 3, kind: "user", text: "Yes, and make question 3 harder." },
  { at: 4, kind: "ai", text: "Updated. Share the link with your cohort whenever you're ready." },
] as const;

const OPTIONS = [
  "Less than 500 million",
  "Around 750 million",
  "More than a billion people",
  "2 billion",
];

export const AnimatedDemo = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 7), 1800);
    return () => clearInterval(id);
  }, []);

  const visible = SCRIPT.filter((m) => m.at <= step);

  return (
    <section className="py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 bg-black/5 text-slate-700 text-xs font-bold uppercase tracking-[0.2em] mb-6 rounded">
            See it in motion
          </span>
          <h2 className="font-display italic text-4xl md:text-5xl lg:text-6xl text-slate-900 leading-tight">
            Chat on the left. A ready-to-share quiz on the right.
          </h2>
          <p className="text-base md:text-lg text-slate-600 mt-6 leading-relaxed max-w-3xl mx-auto">
            No question editors, no templates. Describe what your students need to know,
            and watch the assessment build itself.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-none overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          {/* Chat side */}
          <div className="border-b lg:border-b-0 lg:border-r border-border p-5 sm:p-6 flex flex-col min-h-[380px]">
            <div className="flex items-center gap-2 pb-4 border-b border-border mb-4">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">AI Assistant</span>
            </div>

            <div className="flex-1 space-y-3">
              {visible.map((m, i) => (
                <div
                  key={i}
                  className={`animate-fade-in flex ${m.kind === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.kind === "thinking" ? (
                    <span className="text-xs text-muted-foreground italic flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      {m.text}
                    </span>
                  ) : (
                    <div
                      className={`max-w-[85%] rounded-md px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        m.kind === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      {m.text}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-md border border-border px-3 py-2">
              <span className="flex-1 text-[13px] text-muted-foreground">
                Describe what you want to create…
              </span>
              <Send className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Preview side */}
          <div className="p-5 sm:p-6 bg-background">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Live preview
              </span>
              <span className="text-[11px] rounded-md border border-border px-2 py-0.5 text-muted-foreground">
                Question 1 of 5
              </span>
            </div>

            <div className="rounded-md border border-border p-5">
              <div className="h-1 w-full rounded-full bg-secondary mb-5 overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-700"
                  style={{ width: `${Math.min(step, 5) * 20}%` }}
                />
              </div>

              <h3 className="text-sm font-semibold text-foreground mb-4 leading-snug">
                Globally, what is the approximate prevalence of mental health conditions?
              </h3>

              <div className="space-y-2">
                {OPTIONS.map((opt, i) => {
                  const revealed = step >= i;
                  const correct = step >= 5 && i === 2;
                  return (
                    <div
                      key={opt}
                      className={`rounded-md border px-3 py-2 text-[13px] transition-all duration-500 flex items-center justify-between ${
                        revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                      } ${
                        correct
                          ? "border-accent bg-accent/10 text-foreground"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      <span>
                        <span className="font-semibold mr-2">{"ABCD"[i]}.</span>
                        {opt}
                      </span>
                      {correct && <CheckCircle2 className="w-4 h-4 text-accent" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lecturer payoff */}
            <div
              className={`mt-4 rounded-md border border-border bg-secondary/60 px-4 py-3 transition-all duration-500 ${
                step >= 6 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1">
                <TrendingDown className="w-3.5 h-3.5" />
                What you get back
              </div>
              <p className="text-[13px] text-foreground leading-relaxed">
                42% of your cohort missed <span className="font-semibold">prevalence &amp; epidemiology</span> — start
                Monday's lecture there.
              </p>
            </div>
          </div>
        </div>

        {/* Lecturer benefits styled like Cadmus cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {[
            {
              title: "5 minutes, not an evening",
              desc: "A full pre-lecture activity built in one conversation.",
              icon: Clock,
              color: "text-blue-600",
              bg: "bg-blue-100",
            },
            {
              title: "Gaps, not just grades",
              desc: "See exactly which topic your cohort is weakest on.",
              icon: BarChart2,
              color: "text-rose-600",
              bg: "bg-rose-100",
            },
            {
              title: "One link, no logins",
              desc: "Students join instantly — nothing to set up.",
              icon: LinkIcon,
              color: "text-green-600",
              bg: "bg-green-100",
            },
          ].map((benefit) => (
            <div key={benefit.title} className="rounded-2xl bg-[#FFFDFA] p-8 shadow-sm flex flex-col gap-4">
              <div className={`w-10 h-10 rounded-lg ${benefit.bg} flex items-center justify-center`}>
                <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-800 mb-2">{benefit.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
