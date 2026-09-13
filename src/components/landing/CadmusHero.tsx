import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/landing/collage-diagnose.jpg";

export const CadmusHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-20 md:pt-32 pb-32 md:pb-48" style={{ backgroundColor: 'hsl(var(--hero-band))' }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center animate-fade-in relative z-10">
        <h1
          className="font-display text-5xl md:text-7xl leading-[1.05] tracking-tight mb-8 mx-auto max-w-4xl"
          style={{ color: 'hsl(var(--hero-band-foreground))' }}
        >
          Walk into every lecture knowing what your cohort is still struggling with and what to explain next.
        </h1>
        <p
          className="text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10"
          style={{ color: 'hsl(var(--hero-band-muted))' }}
        >
          Chat for five minutes, get a pre lecture check, share one link. No student logins, no LMS setup, no marking.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => navigate('/auth?mode=signup')}
            className="rounded-md bg-white text-black px-8 py-4 font-nav text-base font-semibold hover:bg-gray-100 transition-colors"
          >
            Start your first check free
          </button>
        </div>
      </div>

      {/* The overlapping dashboard image just like Cadmus */}
      <div className="max-w-5xl mx-auto px-6 sm:px-8 mt-16 md:mt-24 relative z-20" style={{ marginBottom: '-200px' }}>
        <div className="bg-white p-2 rounded-xl shadow-2xl overflow-hidden border border-gray-200 mx-auto max-w-4xl">
          <div className="relative w-full h-[300px] md:h-[500px]">
            <img 
              src="/cadmus_clone/static/videos-6577752a69196bbaeb790fd48d44f324.svg" 
              alt="Dashboard Preview" 
              className="absolute inset-0 w-full h-full rounded-lg object-cover bg-gray-50 object-top"
              onError={(e) => {
                e.currentTarget.src = heroImg;
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CadmusHero;
