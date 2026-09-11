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
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h3 className="font-display italic text-3xl md:text-5xl text-foreground mb-4 max-w-2xl mx-auto">
            Simple, transparent pricing
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            One subscription for everything: pre-lecture activities, flashcards, matching games and cohort insights. Cancel anytime.
          </p>
        </div>

        {hasYearly && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 text-[13px] font-nav font-semibold rounded-md border transition-colors ${!isYearly ? 'bg-foreground text-background border-foreground' : 'border-border text-foreground'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 text-[13px] font-nav font-semibold rounded-md border transition-colors ${isYearly ? 'bg-foreground text-background border-foreground' : 'border-border text-foreground'}`}
            >
              Yearly
            </button>
          </div>
        )}

        {/* Discount Banner */}
        <div className="mb-8 max-w-5xl mx-auto">
          <DiscountBanner location="pricing" />
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="p-8">
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
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto items-start">
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
                  className={`relative bg-card p-8 rounded-md border transition-all duration-300 hover:-translate-y-0.5 ${isPopular ? 'border-foreground shadow-[0_8px_30px_rgb(0,0,0,0.10)]' : 'border-border/60'}`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-foreground text-background text-[11px] font-nav font-semibold px-3 py-1">
                      Most popular
                    </Badge>
                  )}

                  <div className="mb-6">
                    <h4 className="text-xl font-semibold mb-2 text-foreground">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed min-h-[40px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6 pb-6 border-b border-border/50">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold text-foreground">
                        ${formatPrice(displayPrice)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {billingType === 'one_time' ? 'one-time' : isYearly && plan.price_yearly ? '/year' : '/month'}
                      </span>
                    </div>
                    <p className="text-[13px] font-nav text-muted-foreground mt-2">
                      {isFree
                        ? 'Free forever — no card required'
                        : isYearly && plan.price_yearly
                          ? `$${(plan.price_yearly / 12).toFixed(2)}/month billed annually`
                          : 'Billed monthly · cancel anytime'}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => {
                      const isHighlighted = feature.startsWith('⭐');
                      const featureText = isHighlighted ? feature.substring(2).trim() : feature;
                      const isCreditFeature = /\d+\s+AI credits per month/i.test(featureText);

                      return (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" strokeWidth={3} />
                          <span className={`text-sm leading-relaxed ${isHighlighted ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                            {isCreditFeature ? (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center gap-1 cursor-help underline decoration-dotted underline-offset-4 decoration-muted-foreground">
                                      {featureText}
                                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs text-xs">
                                    <p>
                                      <span className="font-semibold">1 credit</span> = one AI generation
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
                    className="w-full h-11 text-[13px] font-nav font-semibold"
                  >
                    {isFree ? 'Start free' : `Get ${plan.name}`}
                  </Button>

                  {!isFree && (
                    <p className="mt-3 text-center text-xs font-nav font-medium text-foreground">
                      Cancel anytime — no contract, no notice period
                    </p>
                  )}

                  <div className="mt-5 pt-5 border-t border-border/50 flex flex-col items-center gap-2 text-center">
                    <p className="text-xs font-nav text-muted-foreground flex items-center gap-1.5">
                      <Lock className="w-3 h-3 flex-shrink-0" />
                      {isFree ? 'No card required' : 'Secure Stripe checkout'}
                    </p>
                    {!isFree && (
                      <>
                        <a
                          href="/terms-of-service#billing"
                          className="flex items-center gap-1.5 text-xs font-nav font-medium text-foreground hover:underline"
                        >
                          <Shield className="w-3 h-3 flex-shrink-0" />
                          14-day money-back guarantee
                        </a>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CreditCard className="w-3 h-3 flex-shrink-0" />
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
