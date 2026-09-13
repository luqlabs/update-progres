import { useEffect, useRef, useState } from "react";

const rows = [
  { old: "Manual entry in the LMS", new: "Describe it in chat, get a draft" },
  { old: "Endless clicks and rigid forms", new: "Edit every question by hand" },
  { old: "Questions written from scratch", new: "Built from your own lecture material" },
  { old: "Grades, but no idea where the gap is", new: "Per-topic cohort gap analysis" },
  { old: "An evening lost per quiz", new: "Ready in about five minutes" },
];

export const MethodComparisonSection = ({ className = "" }: { className?: string }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let loopTimeout: ReturnType<typeof setTimeout>;
    
    const playSequence = () => {
      // Instant reset ke state awal tanpa transisi
      setVisible(false);
      
      // Tunggu 50ms agar browser merender state reset, lalu mulai transisi
      setTimeout(() => {
        setVisible(true);
        // Animasi memakan waktu ~1.5 detik. Kita tahan selama 2 detik setelah selesai (total 3.5s), lalu ulang.
        loopTimeout = setTimeout(playSequence, 3500);
      }, 50);
    };

    playSequence();

    return () => {
      clearTimeout(loopTimeout);
    };
  }, []);

  return (
    <section className={`py-24 md:py-32 px-6 sm:px-8 max-w-5xl mx-auto ${className}`}>
      <div className="text-center mb-16 md:mb-24">
        <span className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">
          The Difference
        </span>
        <h2 className="font-display italic text-4xl md:text-5xl text-slate-900 mb-6 leading-tight">
          Stop fighting with forms. Start<br className="hidden md:block" /> teaching.
        </h2>
        <p className="text-slate-600 text-lg md:text-xl">
          The difference between an evening of set-up and a few minutes of conversation.
        </p>
      </div>

      <div className="relative max-w-4xl mx-auto">
        {/* Table Headers */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-center mb-8 px-2 md:px-0">
          <h3 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">The Old Way</h3>
          <div className="w-8"></div>
          <h3 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-900">The Quizabl Way</h3>
        </div>

        <div className="relative">
          {/* Center line connecting them */}
          <div className="absolute left-1/2 top-4 bottom-4 w-[1px] bg-slate-200 -translate-x-1/2 z-0">
             <div 
                className={`absolute top-0 left-0 w-full bg-slate-800 ${
                  visible ? "transition-all duration-[1500ms] ease-out" : ""
                }`} 
                style={{ height: visible ? '100%' : '0%' }}
             />
          </div>

          <div className="space-y-4 relative z-10 overflow-hidden px-4 md:px-12 py-4">
            {rows.map((row, i) => (
              <div 
                key={i} 
                className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-center"
              >
                {/* Old Way side (Flies in from left) */}
                <div 
                  className={`bg-[#f8fafc] border border-slate-200 text-slate-500 rounded-xl px-4 md:px-6 py-3.5 text-sm md:text-base font-medium text-center shadow-sm ${
                    visible ? "transition-all duration-700 ease-out opacity-100 translate-x-0" : "opacity-0 -translate-x-16 md:-translate-x-32"
                  }`}
                  style={{ transitionDelay: visible ? `${i * 150}ms` : '0ms' }}
                >
                  {row.old}
                </div>
                
                {/* Center dot (Diamond shape) */}
                <div className="w-8 flex justify-center">
                  <div 
                    className={`w-2.5 h-2.5 rotate-45 ${
                      visible ? "transition-all duration-500 opacity-100 scale-100" : "opacity-0 scale-50"
                    }`}
                    style={{ 
                      transitionDelay: visible ? `${(i * 150) + 200}ms` : '0ms',
                      backgroundColor: visible ? '#1e293b' : '#e2e8f0' 
                    }}
                  ></div>
                </div>

                {/* Quizabl Way side (Flies in from right) */}
                <div 
                  className={`bg-[#FFEFE5] text-slate-900 rounded-xl px-4 md:px-6 py-3.5 text-sm md:text-base font-medium text-center shadow-sm ${
                    visible ? "transition-all duration-700 ease-out opacity-100 translate-x-0" : "opacity-0 translate-x-16 md:translate-x-32"
                  }`}
                  style={{ transitionDelay: visible ? `${i * 150}ms` : '0ms' }}
                >
                  {row.new}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethodComparisonSection;
