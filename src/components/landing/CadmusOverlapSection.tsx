export const CadmusOverlapSection = ({
  title,
  subtitle,
  description,
  buttonText,
  imageUrl,
  reverse = false,
}: {
  title: string;
  subtitle?: string;
  description: string;
  buttonText: string;
  imageUrl: string;
  reverse?: boolean;
}) => {
  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-8 py-20 pb-24 md:pb-32">
      {/* Wrapper for image and card to establish relative positioning context */}
      <div className="relative w-full max-w-[1040px] mx-auto">
        
        {/* The large image wrapper */}
        <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden shadow-lg">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* The hanging white card */}
        <div 
          className={`bg-white rounded-xl p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] 
          w-[90%] md:w-[60%] lg:w-[45%] mx-auto lg:mx-0 relative lg:absolute lg:-bottom-12 
          ${reverse ? 'lg:-right-12' : 'lg:-left-12'}
          -mt-16 lg:mt-0 z-30`}
        >
          {subtitle && (
            <span className="block text-xs font-bold uppercase tracking-[0.15em] mb-3 text-primary">
              {subtitle}
            </span>
          )}
          <h2 className="font-display text-3xl md:text-5xl leading-[1.15] text-foreground mb-4">
            {title}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8">
            {description}
          </p>
          <button className="rounded bg-[#0f172a] text-white px-5 py-2.5 font-nav text-sm font-semibold hover:bg-[#1e293b] transition-colors border border-[#0f172a]">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CadmusOverlapSection;
