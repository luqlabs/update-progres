import { GraduationCap, BookOpen, Users, FlaskConical, Scale, HeartPulse } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const audiences = [
  {
    icon: GraduationCap,
    title: "Professors",
    description: "Open the term with a 5-minute activity. Walk into the first lecture knowing exactly which prerequisites your cohort is missing.",
    color: "text-orange-600"
  },
  {
    icon: BookOpen,
    title: "Lecturers",
    description: "Run a formative check before each topic, so contact hours go to the concepts students actually struggle with.",
    color: "text-rose-600"
  },
  {
    icon: Users,
    title: "Assistant Lecturers & TAs",
    description: "Prepare tutorials around real evidence. See which students need a nudge before they fall quietly behind.",
    color: "text-purple-600"
  },
  {
    icon: FlaskConical,
    title: "STEM Lecturers",
    description: "Catch shaky prerequisites — algebra, units, notation — before they compound through the whole module.",
    color: "text-emerald-600"
  },
  {
    icon: Scale,
    title: "Law & Business Lecturers",
    description: "Test case comprehension and terminology from your own readings, not from a generic question bank.",
    color: "text-blue-600"
  },
  {
    icon: HeartPulse,
    title: "Health Sciences Lecturers",
    description: "Check clinical reasoning and recall ahead of practicals, so lab and placement time is spent on the hard parts.",
    color: "text-pink-600"
  },
];

export const TargetAudienceSection = ({ className = "" }: { className?: string }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      // Only animate while entering the viewport.
      // Once rect.top goes below 0 (user scrolls past), cap it at 0 to stop movement.
      setOffset(Math.max(0, rect.top));
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className={`relative pt-32 pb-24 overflow-hidden ${className}`}>
      
      {/* 1. Parallax Floating Hero Zone */}
      <div className="relative max-w-6xl mx-auto px-6 mb-24 min-h-[40vh] md:min-h-[50vh] flex flex-col items-center justify-center">
        
        {/* Left Side Pills (Moving Right as you scroll down) */}
        <div 
          className="hidden md:flex absolute top-[10%] left-[5%] items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-3 rounded-full shadow-lg border border-white"
          style={{ transform: `translateY(${offset * 0.05}px) translateX(${offset * -0.15}px) rotate(4deg)` }}
        >
          <GraduationCap className="w-5 h-5 text-orange-600" />
          <span className="text-[15px] font-bold text-slate-800">Professors</span>
        </div>

        <div 
          className="hidden md:flex absolute top-[55%] left-[-2%] items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-3 rounded-full shadow-lg border border-white"
          style={{ transform: `translateY(${offset * -0.04}px) translateX(${offset * -0.2}px) rotate(0deg)` }}
        >
          <FlaskConical className="w-5 h-5 text-emerald-600" />
          <span className="text-[15px] font-bold text-slate-800">STEM Lecturers</span>
        </div>

        <div 
          className="hidden md:flex absolute top-[85%] left-[15%] items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-3 rounded-full shadow-lg border border-white"
          style={{ transform: `translateY(${offset * 0.08}px) translateX(${offset * -0.1}px) rotate(-4deg)` }}
        >
          <Scale className="w-5 h-5 text-blue-600" />
          <span className="text-[15px] font-bold text-slate-800">Law & Business</span>
        </div>

        {/* Right Side Pills (Moving Left as you scroll down) */}
        <div 
          className="hidden md:flex absolute top-[15%] right-[5%] items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-3 rounded-full shadow-lg border border-white"
          style={{ transform: `translateY(${offset * -0.06}px) translateX(${offset * 0.15}px) rotate(-4deg)` }}
        >
          <BookOpen className="w-5 h-5 text-rose-600" />
          <span className="text-[15px] font-bold text-slate-800">Lecturers</span>
        </div>

        <div 
          className="hidden md:flex absolute top-[50%] right-[-3%] items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-3 rounded-full shadow-lg border border-white"
          style={{ transform: `translateY(${offset * 0.07}px) translateX(${offset * 0.22}px) rotate(0deg)` }}
        >
          <Users className="w-5 h-5 text-purple-600" />
          <span className="text-[15px] font-bold text-slate-800">Assistant & TAs</span>
        </div>

        <div 
          className="hidden md:flex absolute top-[80%] right-[10%] items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-3 rounded-full shadow-lg border border-white"
          style={{ transform: `translateY(${offset * -0.03}px) translateX(${offset * 0.12}px) rotate(4deg)` }}
        >
          <HeartPulse className="w-5 h-5 text-pink-600" />
          <span className="text-[15px] font-bold text-slate-800">Health Sciences</span>
        </div>

        {/* Center Text */}
        <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-orange-900/50 mb-6 block">
            Who it's for
          </span>
          <h2 className="font-display italic text-4xl md:text-5xl lg:text-6xl text-slate-900 mb-6 leading-[1.15]">
            Built for lecturers who take student success personally
          </h2>
          <p className="text-lg md:text-xl text-slate-800/70 leading-relaxed max-w-xl mx-auto font-medium">
            For educators who would rather find the gap before the exam than explain it afterwards.
          </p>
        </div>
      </div>

      {/* 2. Detailed Bento Grid Below */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {audiences.map((aud) => (
             <div 
               key={aud.title} 
               className="bg-white/40 hover:bg-white/70 backdrop-blur-sm border border-white/60 rounded-[2rem] p-8 transition-all duration-500 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 group"
             >
               <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                 <aud.icon className={`w-6 h-6 ${aud.color}`} strokeWidth={2.5} />
               </div>
               <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">{aud.title}</h3>
               <p className="text-sm text-slate-700 leading-relaxed font-medium">{aud.description}</p>
             </div>
          ))}
        </div>
      </div>

    </section>
  );
};

export default TargetAudienceSection;
