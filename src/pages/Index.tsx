import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Helmet } from "react-helmet";
import { useCrisp } from "@/hooks/useCrisp";

import { HeroCollage } from "@/components/landing/HeroCollage";
import { CadmusMaterialSection } from "@/components/landing/CadmusMaterialSection";
import { AnimatedDemo } from "@/components/landing/AnimatedDemo";
import { CadmusHowItWorks } from "@/components/landing/CadmusHowItWorks";

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

import { getCanonicalUrl, createOrganizationSchema, createWebsiteSchema } from "@/lib/seo";

const Index = () => {
  const navigate = useNavigate();
  useCrisp();

  const canonicalUrl = getCanonicalUrl('');
  const organizationSchema = createOrganizationSchema();
  const websiteSchema = createWebsiteSchema();

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <Helmet>
        <title>Quizabl — Pre-lecture Checks for Lecturers, Tutors & Professors</title>
      </Helmet>

      <div className="min-h-screen w-full bg-background text-foreground selection:bg-accent/20 selection:text-primary pb-0">
        {/* Original Lovable Hero + Nav */}
        <div style={{ backgroundColor: 'hsl(var(--hero-band))' }}>
          
          {/* Floating Pill Nav */}
          <div className="pt-6 px-4 sm:px-6 z-50 relative">
            <nav className="mx-auto max-w-5xl bg-background rounded-full px-4 py-3 sm:py-4 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <button onClick={() => navigate('/')} className="flex items-center shrink-0" aria-label="Quizabl home">
                <Logo size="sm" />
              </button>
              <div className="hidden md:flex items-center gap-7 font-nav text-[13px] font-medium text-foreground">
                <button onClick={() => scrollTo('features')} className="hover:text-primary transition-colors">Features</button>
                <button onClick={() => scrollTo('audience')} className="hover:text-primary transition-colors">Who it's for</button>
                <button onClick={() => scrollTo('pricing')} className="hover:text-primary transition-colors">Pricing</button>
              </div>
              <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={() => navigate('/auth')} className="hidden sm:inline-flex font-nav text-[13px] font-semibold text-foreground hover:text-primary transition-colors border px-4 py-1.5 rounded-full border-border">Login</button>
                <button onClick={() => navigate('/auth?mode=signup')} className="hidden sm:inline-flex font-nav text-[13px] font-semibold rounded-full bg-primary text-primary-foreground px-5 py-2 hover:bg-primary-hover transition-colors">Sign up</button>
                <Sheet>
                  <SheetTrigger asChild className="md:hidden">
                    <button aria-label="Open menu" className="p-2 -mr-1 text-foreground">
                      <Menu className="w-5 h-5" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[80%] sm:w-[360px] bg-white">
                    <div className="flex flex-col gap-5 mt-10 text-base font-medium text-foreground">
                      <button onClick={() => navigate('/auth?mode=signup')} className="rounded-md bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold">Sign up</button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </nav>
          </div>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center pt-16 md:pt-24 animate-fade-in">
            <h1
              className="font-display text-4xl md:text-6xl leading-[1.1] tracking-tight mb-6"
              style={{ color: 'hsl(var(--hero-band-foreground))' }}
            >
              Walk into every lecture knowing what your cohort is still struggling with — and what to explain next.
            </h1>
            <p
              className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-10"
              style={{ color: 'hsl(var(--hero-band-muted))' }}
            >
              Chat for five minutes, get a pre-lecture check, share one link. No student logins, no LMS setup, no marking.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/auth?mode=signup')}
                className="rounded-md bg-white text-black px-6 py-3 font-nav text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Start your first check — free
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
        <div className="bg-white relative z-[21] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden">
          <ProductTabs />
        </div>

        {/* 7. Emerald Band — Why Quizabl + Stats */}
        <div className="relative z-[22] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: 'hsl(var(--hero-band))' }}>
          <section className="py-20 md:py-28">
            <div className="max-w-6xl mx-auto px-6 sm:px-8">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] mb-3" style={{ color: 'hsl(var(--hero-band-muted))' }}>Why Quizabl</span>
                <h2 className="font-display italic text-3xl md:text-5xl leading-[1.1]" style={{ color: 'hsl(var(--hero-band-foreground))' }}>
                  Why lecturers choose Quizabl for their cohort
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                {[
                  { title: "Spot the gaps", desc: "Spot the gaps in your cohort before the lecture, not after the exam." },
                  { title: "No student logins", desc: "No student logins, no setup — one link works on any device." },
                  { title: "Your material", desc: "Works with the material you already have: PDFs, slides, notes or a URL." },
                  { title: "Minutes, not hours", desc: "Build, edit and share in a single sitting." },
                ].map((item) => (
                  <div key={item.title} className="text-center">
                    <h3 className="font-semibold text-base mb-2" style={{ color: 'hsl(var(--hero-band-foreground))' }}>{item.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'hsl(var(--hero-band-muted))' }}>{item.desc}</p>
                  </div>
                ))}
              </div>
              <StatsSection tone="band" />
            </div>
          </section>
        </div>

        {/* 8. Features Grid */}
        <div className="relative z-[23] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: 'hsl(var(--cadmus-cream))' }}>
          <FeaturesSection />
        </div>

        {/* 9. Method Comparison */}
        <div className="relative z-[24] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: "#e8f0fe" }}>
          <MethodComparisonSection />
          <ComparisonSection />
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

        {/* 14. Footer CTA & Footer — NOT TOUCHED */}
        <div className="relative z-[60] -mt-16 rounded-t-[3rem] md:rounded-t-[4rem] overflow-hidden" style={{ backgroundColor: 'hsl(var(--hero-band))' }}>
          <section className="py-20 md:py-28">
            <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
              <h2 className="font-display italic text-3xl md:text-5xl leading-[1.1] mb-5 text-white">
                Start with a single pre-lecture activity.
              </h2>
              <button onClick={() => navigate('/auth')} className="rounded-md bg-white text-black px-8 py-4 font-nav text-[14px] font-semibold hover:bg-gray-100 transition-colors">
                Get started free
              </button>
            </div>
          </section>
          <Footer />
        </div>

      </div>
    </>
  );
};

export default Index;
