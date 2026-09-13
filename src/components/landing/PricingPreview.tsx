import { Button } from "@/components/ui/button";
import { Check, Lock, CreditCard, Shield, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DiscountBanner } from "./DiscountBanner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Extend Window interface for GTM dataLayer
declare global {
  interface Window {
    dataLayer: any[];
    lintrk: ((action: string, data: Record<string, any>) => void) & { q?: any[] };
  }
}

interface Plan {
  id: string;
  name: string;
  description: string;
  billing_type?: string;
  is_free_tier?: boolean;
  price_one_time?: number;
  price_monthly?: number;
  price_yearly?: number;
  features: string[];
  popular: boolean;
}

export const PricingPreview = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    // Hardcoded plans for landing page preview (no Supabase needed)
    const mockPlans: Plan[] = [
      {
        id: "free",
        name: "Free",
        description: "Everything you need to run your first pre-lecture check.",
        billing_type: "subscription",
        is_free_tier: true,
        price_monthly: 0,
        price_yearly: 0,
        features: [
          "10 activities total",
          "5 AI credits per month",
          "Unlimited participants",
          "Unlimited plays",
          "Basic analytics"
        ],
        popular: false
      },
      {
        id: "basic",
        name: "Basic",
        description: "For lecturers checking comprehension in a single module.",
        billing_type: "subscription",
        is_free_tier: false,
        price_monthly: 9.99,
        price_yearly: 95.90, // $7.99/mo
        features: [
          "50 activities total",
          "50 AI credits per month",
          "⭐ Session-level insights",
          "⭐ Common mistake tracking",
          "Hide Quizabl branding",
          "Export to CSV"
        ],
        popular: true
      },
      {
        id: "pro",
        name: "Pro",
        description: "For teaching multiple modules or large cohorts.",
        billing_type: "subscription",
        is_free_tier: false,
        price_monthly: 14.99,
        price_yearly: 143.90, // $11.99/mo
        features: [
          "⭐ Unlimited activities",
          "⭐ 150 AI credits per month",
          "Session-level insights",
          "Common mistake tracking",
          "Hide Quizabl branding",
          "Priority support"
        ],
        popular: false
      }
    ];
    
    setPlans(mockPlans);
    setIsLoading(false);
  }, []);

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "0";
    const hasCents = Math.round(price * 100) % 100 !== 0;
    return price.toLocaleString('en-US', {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: hasCents ? 2 : 0,
    });
  };

  const hasYearly = plans.some((p) => (p.price_yearly || 0) > 0);
  const mostPopularId = plans.length ? plans[plans.length - 1].id : null;

  return (
    <section id="pricing" className="py-24 md:py-32 px-6 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 relative z-10">
          <span className="text-sm font-bold tracking-wider text-indigo-900/50 mb-6 block">
            Pricing
          </span>
          <h3 className="font-display italic text-4xl md:text-5xl lg:text-6xl text-slate-900 mb-6 leading-[1.15]">
            Simple, transparent pricing
          </h3>
          <p className="text-lg md:text-xl text-slate-800/70 leading-relaxed max-w-2xl mx-auto font-medium">
            One subscription for everything: pre-lecture activities, flashcards, matching games and cohort insights. Cancel anytime.
          </p>
        </div>

        {hasYearly && (
          <div className="flex items-center justify-center gap-2 mb-12">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2.5 text-[14px] font-bold rounded-full transition-all duration-300 ${!isYearly ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2.5 text-[14px] font-bold rounded-full transition-all duration-300 ${isYearly ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              Yearly
            </button>
          </div>
        )}

        {/* Discount Banner */}
        <div className="mb-12 max-w-5xl mx-auto">
          <DiscountBanner location="pricing" />
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="p-10 rounded-[2.5rem]">
                <Skeleton className="h-6 w-24 mb-4" />
                <Skeleton className="h-16 w-full mb-6" />
                <Skeleton className="h-10 w-full mb-6" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto items-stretch">
            {plans.map((plan) => {
              const billingType = (plan.billing_type || 'subscription') as 'subscription' | 'one_time' | 'credits';
              const isFree = plan.is_free_tier || (!plan.price_monthly && billingType !== 'one_time');
              const displayPrice = billingType === 'one_time'
                ? plan.price_one_time
                : isYearly && plan.price_yearly
                  ? plan.price_yearly
                  : plan.price_monthly;
              const isPopular = plan.id === mostPopularId && !isFree;

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col p-8 md:p-10 rounded-[2.5rem] transition-all duration-500 hover:-translate-y-2 border-0 ${
                    isPopular 
                      ? 'bg-white shadow-[0_20px_50px_-15px_rgba(79,70,229,0.2)] ring-2 ring-indigo-500/20' 
                      : 'bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-xl hover:bg-white ring-1 ring-slate-200'
                  }`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-100 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold tracking-wide uppercase px-5 py-1.5 border border-indigo-200 shadow-sm">
                      Most popular
                    </Badge>
                  )}

                  <div className="mb-6">
                    <h4 className={`text-xl font-bold mb-3 ${isPopular ? 'text-indigo-600' : 'text-slate-900'}`}>{plan.name}</h4>
                    <p className="text-[15px] font-medium text-slate-600 leading-relaxed min-h-[44px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8 pb-8 border-b border-slate-200/80">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl md:text-5xl font-display font-medium text-slate-900">
                        ${formatPrice(displayPrice)}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">
                        {billingType === 'one_time' ? 'one-time' : isYearly && plan.price_yearly ? '/year' : '/month'}
                      </span>
                    </div>
                    <p className="text-[13px] font-bold text-slate-500 mt-3">
                      {isFree
                        ? 'Free forever, no card required'
                        : isYearly && plan.price_yearly
                          ? `$${(plan.price_yearly / 12).toFixed(2)}/month billed annually`
                          : 'Billed monthly · cancel anytime'}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow">
                    {plan.features.map((feature) => {
                      const isHighlighted = feature.startsWith('⭐');
                      const featureText = isHighlighted ? feature.substring(2).trim() : feature;
                      const isCreditFeature = /\d+\s+AI credits per month/i.test(featureText);

                      return (
                        <li key={feature} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isHighlighted ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                          <span className={`text-[15px] leading-relaxed ${isHighlighted ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {isCreditFeature ? (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1.5 cursor-help underline decoration-dotted underline-offset-4 decoration-slate-400">
                                      {featureText}
                                      <Info className="w-3.5 h-3.5 text-slate-400" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs text-xs font-medium">
                                    <p>
                                      <span className="font-bold">1 credit</span> = one AI generation
                                      or one AI chat edit. Manual editing, sharing, student plays and analytics
                                      never use credits.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              featureText
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <Button
                    onClick={() => {
                      window.dataLayer = window.dataLayer || [];
                      window.dataLayer.push({
                        event: 'initiate_checkout',
                        plan_name: plan.name,
                        plan_id: plan.id,
                        value: displayPrice || 0,
                        currency: 'USD'
                      });

                      if (window.lintrk) {
                        window.lintrk('track', { conversion_id: 24643052 });
                      }

                      const redirectPath = isFree
                        ? '/dashboard'
                        : `/upgrade?plan_id=${plan.id}&auto_checkout=true`;
                      navigate(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
                    }}
                    variant={isPopular ? 'default' : 'outline'}
                    className={`w-full h-12 text-[14px] font-bold rounded-xl transition-colors ${
                      isPopular 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                        : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {isFree ? 'Start free' : `Get ${plan.name}`}
                  </Button>

                  {!isFree && (
                    <p className="mt-4 text-center text-[12px] font-bold text-slate-500">
                      Cancel anytime, no notice period
                    </p>
                  )}

                  <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col items-center gap-3 text-center">
                    <p className="text-[12px] font-bold text-slate-500 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                      {isFree ? 'No card required' : 'Secure Stripe checkout'}
                    </p>
                    {!isFree && (
                      <>
                        <a
                          href="/terms-of-service#billing"
                          className="flex items-center gap-2 text-[12px] font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                          14-day money-back guarantee
                        </a>
                        <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400">
                          <CreditCard className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Visa · Mastercard · AmEx</span>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
