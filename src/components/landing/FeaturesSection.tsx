import {
  MessageSquare,
  Users,
  Target,
  BarChart3,
  ListChecks,
  Clock,
  Layers,
} from "lucide-react";
import studentImg from "@/assets/landing/collage-generate.jpg";
import diagnoseImg from "@/assets/landing/collage-diagnose.jpg";
import analyticsImg from "@/assets/landing/product-analytics.jpg";
import featuresBottomBanner from "@/assets/landing/features-bottom-banner.jpg";

export const FeaturesSection = () => {
  return (
    <section className="py-20 md:py-28 px-6 sm:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="font-display uppercase tracking-[0.15em] text-4xl md:text-6xl text-foreground mb-4">
          Features
        </h2>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* Large Feature 1 (Span 2 cols, 2 rows) */}
        <div className="md:col-span-2 md:row-span-2 rounded-[2rem] p-8 md:p-10 flex flex-col justify-between overflow-hidden relative shadow-sm group" style={{ backgroundColor: "#fff1f2" }}>
          <div className="relative z-10 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "#ffe4e6" }}>
              <Target className="w-6 h-6 text-rose-500" strokeWidth={2} />
            </div>
            <h3 className="font-display text-2xl md:text-3xl text-slate-900 mb-3 leading-tight">
              Diagnose the gap before you teach
            </h3>
            <p className="text-slate-700 leading-relaxed text-sm">
              Run a formative check before lecture and see per-topic results, so you teach to the actual gap instead of your guess.
            </p>
          </div>
          <div className="relative z-10 w-full h-[200px] md:h-[280px] rounded-xl overflow-hidden shadow-md group-hover:-translate-y-2 transition-transform duration-500">
            <img src={analyticsImg} alt="Analytics Dashboard" className="w-full h-full object-cover object-left-top" />
          </div>
        </div>

        {/* Small Feature 1 */}
        <div className="md:col-span-1 md:row-span-1 rounded-[2rem] p-8 flex flex-col justify-center shadow-sm" style={{ backgroundColor: "#f0fdf4" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#dcfce7" }}>
            <Users className="w-5 h-5 text-green-600" strokeWidth={2} />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">No student accounts</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Share one link. Students join instantly — no sign-ups, no lost class time.
          </p>
        </div>

        {/* Small Feature 2 */}
        <div className="md:col-span-1 md:row-span-1 rounded-[2rem] p-8 flex flex-col justify-center shadow-sm" style={{ backgroundColor: "#fef3c7" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#fde68a" }}>
            <ListChecks className="w-5 h-5 text-amber-600" strokeWidth={2} />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Multiple formats</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Mix multiple choice, short answer, and polls in one single activity.
          </p>
        </div>

        {/* Medium Feature (Span 2 cols, 1 row) */}
        <div className="md:col-span-2 md:row-span-1 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center gap-8 shadow-sm overflow-hidden" style={{ backgroundColor: "#eff6ff" }}>
          <div className="flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#dbeafe" }}>
              <MessageSquare className="w-5 h-5 text-blue-600" strokeWidth={2} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Draft it by chatting with AI</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Describe what you want to assess in plain language. Quizabl writes the first draft instantly.
            </p>
          </div>
          <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden shadow-sm shrink-0">
            <img src={studentImg} alt="AI Chatting" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Tall Feature (Span 1 col, 2 rows) */}
        <div className="md:col-span-1 md:row-span-2 rounded-[2rem] p-8 flex flex-col overflow-hidden shadow-sm relative group" style={{ backgroundColor: "#faf5ff" }}>
          <div className="relative z-10 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#f3e8ff" }}>
              <Layers className="w-5 h-5 text-purple-600" strokeWidth={2} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Quizzes & flashcards</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Turn the same source material into a quiz or a flashcard deck instantly.
            </p>
          </div>
          <div className="flex-1 w-full rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-500">
             <img src={diagnoseImg} alt="Quizzes and Flashcards" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Wide Feature (Span 2 cols, 1 row) */}
        <div className="md:col-span-2 md:row-span-1 rounded-[2rem] p-8 flex flex-col justify-center shadow-sm" style={{ backgroundColor: "#f0fdfa" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#ccfbf1" }}>
            <BarChart3 className="w-5 h-5 text-teal-600" strokeWidth={2} />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Real-time cohort insights</h3>
          <p className="text-slate-600 text-sm leading-relaxed max-w-md">
            Live tracking with per-question breakdowns, so you can see who needs help while the session is still running.
          </p>
        </div>

        {/* Small Feature 3 */}
        <div className="md:col-span-1 md:row-span-1 rounded-[2rem] p-8 flex flex-col justify-center shadow-sm" style={{ backgroundColor: "#fdf2f8" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "#fce7f3" }}>
            <Clock className="w-5 h-5 text-pink-600" strokeWidth={2} />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">Hints & timers</h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Set timers and add hints to keep the check challenging but supportive.
          </p>
        </div>

        {/* Image Banner with Floating Card (Span 3 cols, 1 row) */}
        <div className="md:col-span-3 md:row-span-1 relative rounded-[2rem] h-full min-h-[350px]">
          <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-sm">
            <img
              src={featuresBottomBanner}
              alt="Lecturer working happily"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Floating Card positioned overlapping bottom right */}
          <div className="
            absolute z-[30]
            bottom-[-4rem] right-[-2rem]
            md:bottom-[-6rem] md:right-[-4rem] lg:right-[-5rem]
            bg-white rounded-[1.5rem] p-8 md:p-10
            shadow-[0_20px_50px_rgba(0,0,0,0.1)]
            w-[90%] md:w-[480px]
          ">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3 block">
              The Complete Solution
            </span>
            <h3 className="font-display text-2xl md:text-3xl text-foreground mb-4 leading-[1.25]">
              Everything you need to find — and close — the gap
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              From pre-lecture activity to live cohort insights — on one simple subscription, with no student logins.
            </p>
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50">
              Start building
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
