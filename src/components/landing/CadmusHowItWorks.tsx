export const CadmusHowItWorks = () => {
  return (
    <section className="relative z-[20] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] py-24 md:py-32" style={{ backgroundColor: "#4f86b3" }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 lg:mb-32">
          <span className="inline-block px-3 py-1 bg-white/10 text-blue-100 text-xs font-bold uppercase tracking-[0.2em] mb-6 rounded">
            How it works
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-white leading-tight">
            From lecture notes to activity in three steps
          </h2>
        </div>

        <div className="flex flex-col gap-24 lg:gap-32">
          {/* Step 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text Content */}
            <div className="order-2 lg:order-1">
              <h3 className="font-display text-3xl md:text-4xl text-white mb-6 leading-tight">
                Instantly process your course materials
              </h3>
              <p className="text-lg text-blue-100 leading-relaxed">
                No complex forms or tedious manual entry. Simply provide your context—whether it's raw lecture notes, PDF textbook chapters, or web articles—and let Quizabl extract the key concepts automatically.
              </p>
            </div>
            {/* Image */}
            <div className="order-1 lg:order-2">
              <img src="/assets/step1-rmv.png" alt="Upload Material" className="w-full h-auto object-cover" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image (Left on Desktop) */}
            <div className="order-1">
              <img src="/assets/step2-rmv.png" alt="Chat to Refine" className="w-full h-auto object-cover" />
            </div>
            {/* Text Content */}
            <div className="order-2">
              <h3 className="font-display text-3xl md:text-4xl text-white mb-6 leading-tight">
                Conversational refinement
              </h3>
              <p className="text-lg text-blue-100 leading-relaxed">
                Iterate on the generated assessment exactly like you're chatting with a teaching assistant. Need changes? Just tell the AI to "make it harder," "add a hint," or "focus on global strategy" in seconds.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text Content */}
            <div className="order-2 lg:order-1">
              <h3 className="font-display text-3xl md:text-4xl text-white mb-6 leading-tight">
                One link for everything
              </h3>
              <p className="text-lg text-blue-100 leading-relaxed">
                Distribute quizzes, flashcards, and matching games instantly. Students can jump right into the interactive modes using a single link, without needing accounts, passwords, or setup.
              </p>
            </div>
            {/* Image */}
            <div className="order-1 lg:order-2">
              <img src="/assets/step3-rmv.png" alt="Share Instantly" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CadmusHowItWorks;
