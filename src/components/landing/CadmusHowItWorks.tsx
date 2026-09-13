import { FileText, Link as LinkIcon, Upload } from "lucide-react";

export const CadmusHowItWorks = () => {
  return (
    <section className="relative z-[20] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] bg-white py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <span className="block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">
            How it works
          </span>
          <h2 className="font-display italic text-4xl md:text-5xl text-slate-900 leading-tight">
            Three steps from lecture notes to a pre <br className="hidden md:block"/>lecture activity
          </h2>
        </div>

        {/* Horizontal Divider */}
        <div className="w-full max-w-5xl mx-auto h-px bg-black/5 mb-16"></div>

        {/* 3 Columns (Group for dimming effect) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 max-w-5xl mx-auto group">
          
          {/* Step 1 */}
          <div className="flex flex-col pr-8 md:pr-12 group/item transition-opacity duration-300 md:hover:!opacity-100 md:group-hover:opacity-40">
            {/* Micro-interaction UI */}
            <div className="h-16 mb-8 relative">
              {/* Dashed Box */}
              <div className="absolute left-0 bottom-0 w-14 h-12 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center transition-all duration-500 group-hover/item:border-[#2d5249] group-hover/item:bg-[#2d5249]/5">
                <Upload className="w-4 h-4 text-slate-300 transition-colors duration-500 group-hover/item:text-[#2d5249]/50" strokeWidth={2} />
              </div>
              {/* Document Icon dropping */}
              <div className="absolute left-7 bottom-4 -translate-x-1/2 opacity-0 -translate-y-8 transition-all duration-500 group-hover/item:opacity-100 group-hover/item:translate-y-2">
                <div className="bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
                   <FileText className="w-5 h-5 text-[#2d5249]" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <span className="font-display text-4xl md:text-5xl text-[#2d5249] mb-4">01</span>
            <h3 className="font-bold text-slate-900 text-lg mb-3">Upload Your Material</h3>
            <p className="text-slate-500 leading-relaxed text-[15px]">
              Paste lecture notes, PDFs, or URLs. We build questions from your content.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:border-l border-black/5 md:px-12 mt-12 md:mt-0 pt-12 md:pt-0 border-t md:border-t-0 group/item transition-opacity duration-300 md:hover:!opacity-100 md:group-hover:opacity-40">
            {/* Micro-interaction UI */}
            <div className="h-16 mb-8 relative flex flex-col justify-end gap-2 w-24">
              {/* User Bubble */}
              <div className="w-12 h-6 border border-slate-200 rounded-2xl rounded-br-sm self-end flex items-center px-2.5 transition-all duration-500 group-hover/item:border-[#2d5249] group-hover/item:bg-[#2d5249]/5">
                 <div className="w-full h-1 bg-slate-200 rounded-full transition-colors duration-500 group-hover/item:bg-[#2d5249]/30" />
              </div>
              {/* AI Bubble */}
              <div className="w-14 h-7 border border-slate-200 rounded-2xl rounded-bl-sm self-start flex items-center justify-center gap-1 opacity-0 translate-y-2 transition-all duration-500 delay-150 group-hover/item:opacity-100 group-hover/item:translate-y-0 group-hover/item:border-[#2d5249] group-hover/item:bg-[#2d5249]">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-75" />
                <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-150" />
              </div>
            </div>

            <span className="font-display text-4xl md:text-5xl text-[#2d5249] mb-4">02</span>
            <h3 className="font-bold text-slate-900 text-lg mb-3">Chat to Refine</h3>
            <p className="text-slate-500 leading-relaxed text-[15px]">
              Need changes? Just tell the AI. 'Make it harder' or 'Add a hint' in seconds.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:border-l border-black/5 md:pl-12 mt-12 md:mt-0 pt-12 md:pt-0 border-t md:border-t-0 group/item transition-opacity duration-300 md:hover:!opacity-100 md:group-hover:opacity-40">
            {/* Micro-interaction UI */}
            <div className="h-16 mb-8 relative flex items-end">
              <div className="h-10 w-12 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover/item:w-[100px] group-hover/item:border-[#2d5249] group-hover/item:bg-[#2d5249]">
                <div className="absolute transition-all duration-500 group-hover/item:-translate-y-8 group-hover/item:opacity-0">
                  <LinkIcon className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                </div>
                <div className="absolute text-[10px] font-bold tracking-[0.15em] text-white uppercase opacity-0 translate-y-8 transition-all duration-500 group-hover/item:translate-y-0 group-hover/item:opacity-100">
                  Copied
                </div>
              </div>
            </div>

            <span className="font-display text-4xl md:text-5xl text-[#2d5249] mb-4">03</span>
            <h3 className="font-bold text-slate-900 text-lg mb-3">Share Instantly</h3>
            <p className="text-slate-500 leading-relaxed text-[15px]">
              No student logins required. Share one link for Quizzes, Flashcards, and Matching Games.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CadmusHowItWorks;
