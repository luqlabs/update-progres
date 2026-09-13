import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Helmet } from "react-helmet";
import { useCrisp } from "@/hooks/useCrisp";

import { HeroCollage } from "@/components/landing/HeroCollage";
import whyQuizablBanner from "@/assets/landing/why-quizabl-banner.jpg";
import { CadmusMaterialSection } from "@/components/landing/CadmusMaterialSection";
import { AnimatedDemo } from "@/components/landing/AnimatedDemo";
import { CadmusHowItWorks } from "@/components/landing/CadmusHowItWorks";
import ctaIllustration from "@/assets/landing/Final.png";

import { ProductTabs } from "@/components/landing/ProductTabs";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { MethodComparisonSection } from "@/components/landing/MethodComparisonSection";
import { TargetAudienceSection } from "@/components/landing/TargetAudienceSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { PricingPreview } from "@/components/landing/PricingPreview";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";
import { Logo } from "@/components/ui/logo";
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

import { getCanonicalUrl, createOrganizationSchema, createWebsiteSchema } from "@/lib/seo";

const Index = () => {
  const navigate = useNavigate();
  useCrisp();

  useEffect(() => {
    // Initialize Lenis smooth scroll for the landing page
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const canonicalUrl = getCanonicalUrl('');
  const organizationSchema = createOrganizationSchema();
  const websiteSchema = createWebsiteSchema();

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <Helmet>
        <title>Quizabl | Pre lecture Checks for Lecturers, Tutors & Professors</title>
      </Helmet>

      <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground selection:bg-accent/20 selection:text-primary pb-0">
        {/* Original Lovable Hero + Nav */}
        <div style={{ backgroundColor: 'hsl(var(--hero-band))' }}>
          
          {/* Floating Compact Nav */}
          <div className="pt-5 px-4 z-50 relative flex justify-center">
            <nav className="w-full max-w-3xl bg-background rounded-xl px-4 py-2 flex items-center justify-between shadow-sm">
              <button onClick={() => navigate('/')} className="flex items-center shrink-0" aria-label="Quizabl home">
                <Logo size="sm" />
              </button>
              <div className="hidden md:flex items-center gap-5 font-nav text-[13px] font-medium text-foreground">
                <button onClick={() => scrollTo('features')} className="hover:text-primary transition-colors">Features</button>
                <button onClick={() => scrollTo('audience')} className="hover:text-primary transition-colors">Who it's for</button>
                <button onClick={() => scrollTo('pricing')} className="hover:text-primary transition-colors">Pricing</button>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={() => navigate('/auth')} className="hidden sm:inline-flex font-nav text-[13px] font-semibold text-foreground hover:text-primary transition-colors px-2 py-1.5">Login</button>
                <button onClick={() => navigate('/auth?mode=signup')} className="hidden sm:inline-flex font-nav text-[13px] font-semibold rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:bg-primary-hover transition-colors shadow-sm">Sign up</button>
                <Sheet>
                  <SheetTrigger asChild className="md:hidden">
                    <button aria-label="Open menu" className="p-2 -mr-1 text-foreground">
                      <Menu className="w-5 h-5" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[80%] sm:w-[360px] bg-white">
                    <div className="flex flex-col gap-6 mt-12 text-base font-medium text-foreground px-2">
                      <button onClick={() => { scrollTo('features'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); }} className="text-left hover:text-primary transition-colors text-lg">Features</button>
                      <button onClick={() => { scrollTo('audience'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); }} className="text-left hover:text-primary transition-colors text-lg">Who it's for</button>
                      <button onClick={() => { scrollTo('pricing'); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); }} className="text-left hover:text-primary transition-colors text-lg">Pricing</button>
                      <hr className="my-2 border-border/40" />
                      <button onClick={() => navigate('/auth')} className="text-left hover:text-primary transition-colors text-lg">Login</button>
                      <button onClick={() => navigate('/auth?mode=signup')} className="rounded-md bg-primary text-primary-foreground px-5 py-3.5 text-base font-semibold text-center w-full mt-2">Sign up</button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </nav>
          </div>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center pt-8 md:pt-10 animate-fade-in">
            <h1
              className="font-display text-4xl md:text-6xl leading-[1.1] tracking-tight mb-6"
              style={{ color: 'hsl(var(--hero-band-foreground))' }}
            >
              Walk into every lecture knowing what your cohort is still struggling with and what to explain next.
            </h1>
            <p
              className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-10"
              style={{ color: 'hsl(var(--hero-band-muted))' }}
            >
              Chat for five minutes, get a pre lecture check, share one link. No student logins, no LMS setup, no marking.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/auth?mode=signup')}
                className="rounded-md bg-white text-black px-6 py-3 font-nav text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Start your first check free
              </button>
            </div>
          </div>

          {/* Staggered Collage */}
          <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-12 pb-24 md:pb-32">
            <HeroCollage />
          </div>
        </div>

        {/* 1.5 Material Section (Tabs + Overlap Card) */}
        <div className="relative -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: 'hsl(var(--cadmus-cream))' }}>
          <CadmusMaterialSection />
        </div>

        {/* 1.75 Animated Demo */}
        <div className="relative z-[16] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: "#d1e8d8" }}>
          <AnimatedDemo />
        </div>





        {/* 5. How it works (Zig Zag Sections) */}
        <CadmusHowItWorks />

        {/* 6. Product Tabs */}
        <div className="relative z-[21] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: "#f3f0ff" }}>
          <ProductTabs />
        </div>

        {/* 7. Why Quizabl — Cadmus Case Study Style */}
        <div className="relative z-[22] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: 'hsl(var(--cadmus-peach))' }}>
          <section className="py-20 md:py-28">
            <div className="max-w-6xl mx-auto px-6 sm:px-8">

              {/* Image Banner + Floating Card */}
              <div className="relative mb-24 md:mb-28">
                {/* Large Image */}
                <div className="w-full h-[300px] md:h-[420px] rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src={whyQuizablBanner}
                    alt="Lecturer workspace with assessment dashboard"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Floating Card with 4 Feature Points */}
                <div className="
                  relative md:absolute z-10
                  mt-[-2rem] mx-4
                  md:bottom-[-4rem] md:left-[-1rem] md:mx-0
                  bg-white rounded-xl p-8 md:p-10
                  shadow-[0_20px_50px_rgba(0,0,0,0.08)]
                  max-w-md
                ">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-xs font-bold tracking-wider text-muted-foreground">Why Quizabl</span>
                    <span className="text-muted-foreground/40">|</span>
                    <span className="text-xs font-bold tracking-wider text-muted-foreground">Higher Education</span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl text-foreground mb-6 leading-[1.15]">
                    Why lecturers choose Quizabl for their cohort
                  </h3>
                  <div className="space-y-4">
                    {[
                      { title: "Spot the gaps", desc: "Spot the gaps in your cohort before the lecture, not after the exam." },
                      { title: "No student logins", desc: "No student logins, no setup. One link works on any device." },
                      { title: "Your material", desc: "Works with the material you already have: PDFs, slides, notes or a URL." },
                      { title: "Minutes, not hours", desc: "Build, edit and share in a single sitting." },
                    ].map((item) => (
                      <div key={item.title} className="border-l-[3px] border-primary/30 pl-4">
                        <h4 className="text-[13px] font-bold text-foreground mb-0.5">{item.title}</h4>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="text-center">
                <span className="block text-xs font-bold tracking-wider mb-8" style={{ color: 'hsl(var(--primary))' }}>
                  Built for speed and simplicity
                </span>
                <StatsSection tone="light" />
              </div>

            </div>
          </section>
        </div>

        {/* 8. Features Grid */}
        <div className="relative -mt-16 rounded-t-[3rem] md:rounded-t-[4rem]" style={{ backgroundColor: 'hsl(var(--cadmus-cream))' }}>
          <FeaturesSection />
        </div>

        {/* 9. Method Comparison */}
        <div className="relative z-[24] -mt-16 md:-mt-24 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: "#e8f0fe" }}>
          <MethodComparisonSection />
        </div>

        {/* 10. Target Audience */}
        <div className="relative z-[25] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: 'hsl(var(--cadmus-peach))' }}>
          <TargetAudienceSection />
        </div>

        {/* 11. Testimonials / Proof Points */}
        <div className="bg-white relative z-[26] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden">
          <TestimonialSection />
        </div>

        {/* 12. Pricing */}
        <div className="relative z-[27] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: 'hsl(var(--cadmus-cream))' }}>
          <PricingPreview />
        </div>

        {/* 13. FAQ */}
        <div className="bg-white relative z-[28] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden">
          <FAQSection />
        </div>

        {/* 14. Footer CTA */}
        <div className="relative z-[60] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: 'hsl(var(--cadmus-peach))' }}>
          <section className="pt-8 pb-12 md:pt-12 md:pb-16 px-6 sm:px-8">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16">
              <div className="w-full md:w-1/2 text-center md:text-left">
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-slate-900 mb-8 leading-[1.1] tracking-tight">
                  Start with a single pre lecture activity.
                </h2>
                <p className="text-lg text-slate-700 mb-10 leading-relaxed">
                  Join educators who have already discovered the fastest way to engage their cohorts and find out exactly what they don't know.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
                  <button 
                    onClick={() => navigate('/auth')} 
                    className="rounded-full bg-slate-900 text-white px-8 py-3.5 font-nav text-[15px] font-semibold hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto"
                  >
                    Get started free
                  </button>
                </div>
              </div>
              <div className="w-full md:w-1/2 flex justify-center md:justify-end relative">
                {/* Decorative blob or circle behind image */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/60 to-white/10 rounded-full blur-3xl -z-10 transform scale-90" />
                <img 
                  src={ctaIllustration} 
                  alt="Quizabl interactive cards" 
                  className="w-full max-w-[450px] h-auto object-contain transform hover:scale-105 transition-transform duration-700 hover:rotate-1"
                />
              </div>
            </div>
          </section>
        </div>

        {/* 15. Footer */}
        <div className="relative z-[70] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: 'hsl(var(--hero-band))' }}>
          <Footer />
        </div>

      </div>
    </>
  );
};

export default Index;
