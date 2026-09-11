import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Sparkles, ArrowLeft, Shield } from "lucide-react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getCanonicalUrl, createBreadcrumbSchema } from "@/lib/seo";
import { DiscountBanner } from "@/components/landing/DiscountBanner";
interface Plan {
  id: string;
  name: string;
  description: string;
  billing_type: 'subscription' | 'one_time' | 'credits';
  price_monthly: number;
  price_yearly: number;
  price_one_time: number | null;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
  stripe_price_id_one_time: string | null;
  is_free_tier: boolean;
  features: Array<{
    display_name: string;
    feature_value: string;
  }>;
  plan_pricing_features?: Array<{
    id: string;
    feature_text: string;
    is_highlighted: boolean;
    display_order: number;
  }>;
}
export default function Upgrade() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [autoCheckoutInProgress, setAutoCheckoutInProgress] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const {
    toast
  } = useToast();
  const {
    subscription,
    refresh
  } = useSubscription();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const autoCheckoutTriggered = useRef(false);
  const planIdParam = searchParams.get('plan_id');
  const autoCheckout = searchParams.get('auto_checkout') === 'true';
  
  // Helper to get Tolt referral ID with fallback to cookie
  const getToltReferralId = (): string | null => {
    try {
      // Method 1: Try to get from window.tolt_referral (Tolt sets this)
      // @ts-ignore
      if (window.tolt_referral) {
        // @ts-ignore
        console.log('✅ Tolt referral found in window:', window.tolt_referral);
        // @ts-ignore
        return window.tolt_referral;
      }

      // Method 2: Try to read from cookie as fallback
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('tolt_referral='))
        ?.split('=')[1];
      
      if (cookieValue) {
        console.log('✅ Tolt referral found in cookie:', cookieValue);
        return cookieValue;
      }

      console.log('ℹ️ No Tolt referral found - user likely not from affiliate link');
      return null;
    } catch (error) {
      console.error('❌ Error reading Tolt referral:', error);
      return null;
    }
  };
  
  useEffect(() => {
    fetchPlans();
  }, []);

  // Listen for Tolt initialization
  useEffect(() => {
    const handleToltReady = () => {
      // @ts-ignore
      const referralId = window.tolt_referral;
      if (referralId) {
        console.log('🎯 Tolt is ready! Referral ID:', referralId);
      } else {
        console.log('ℹ️ Tolt is ready, but no referral detected (normal for direct traffic)');
      }
    };

    // Listen for Tolt ready event
    window.addEventListener('tolt_referral_ready', handleToltReady);

    // Also check if Tolt is already loaded
    setTimeout(() => {
      // @ts-ignore
      if (window.tolt_referral) {
        // @ts-ignore
        console.log('🎯 Tolt already loaded with referral:', window.tolt_referral);
      }
    }, 1000);

    return () => {
      window.removeEventListener('tolt_referral_ready', handleToltReady);
    };
  }, []);

  // Verify payment with polling
  const verifyPaymentWithPolling = async () => {
    setVerifyingPayment(true);
    const maxAttempts = 8; // 16 seconds total (2 seconds * 8)
    let attempts = 0;
    const pollSubscription = async (): Promise<boolean> => {
      try {
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();
        if (!session) return false;
        const {
          data,
          error
        } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (error) {
          console.error('Error checking subscription:', error);
          return false;
        }

        // If subscription is now active, we're done
        if (data?.subscribed) {
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error polling subscription:', error);
        return false;
      }
    };

    // Poll every 2 seconds
    while (attempts < maxAttempts) {
      const isSubscribed = await pollSubscription();
      if (isSubscribed) {
        await refresh();
        setVerifyingPayment(false);
        toast({
          title: "Success!",
          description: "Your subscription has been activated."
        });
        window.location.href = '/dashboard';
        return;
      }
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Timeout - webhook might be delayed
    setVerifyingPayment(false);
    toast({
      title: "Payment received!",
      description: "Your subscription will be activated shortly. Please refresh the page in a few moments.",
      variant: "default"
    });
    await refresh();
    window.location.href = '/dashboard';
  };

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    if (searchParams.get('success')) {
      verifyPaymentWithPolling();
    } else if (searchParams.get('canceled')) {
      toast({
        title: "Checkout Canceled",
        description: "You can try again whenever you're ready.",
        variant: "destructive"
      });
      window.history.replaceState({}, '', '/upgrade');
    }
  }, [searchParams]);
  useEffect(() => {
    const triggerAutoCheckout = async () => {
      if (autoCheckout && planIdParam && !autoCheckoutTriggered.current && plans.length > 0) {
        autoCheckoutTriggered.current = true;
        setAutoCheckoutInProgress(true);
        const targetPlan = plans.find(p => p.id === planIdParam);
        if (targetPlan) {
          toast({
            title: "Preparing checkout...",
            description: "You'll be redirected to complete your purchase."
          });
          setTimeout(() => {
            handleSubscribe(targetPlan);
          }, 1500);
        }
      }
    };
    triggerAutoCheckout();
  }, [plans, autoCheckout, planIdParam]);
  const fetchPlans = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('subscription_plans').select(`
          *,
          plan_features(display_name, feature_value),
          plan_pricing_features(id, feature_text, is_highlighted, display_order)
        `).eq('is_active', true).eq('show_on_landing', true).order('price_monthly');
      if (error) throw error;

      // Transform plan_features to features
      const transformedPlans = (data || []).map(plan => ({
        ...plan,
        billing_type: (plan.billing_type || 'subscription') as 'subscription' | 'one_time' | 'credits',
        features: plan.plan_features || [],
        plan_pricing_features: plan.plan_pricing_features || []
      }));
      setPlans(transformedPlans);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSubscribe = async (plan: Plan) => {
    try {
      setCheckoutLoading(plan.id);

      // Check if user is authenticated
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to subscribe to a plan.",
          variant: "destructive"
        });
        return;
      }
      if (plan.is_free_tier) {
        // Create free subscription
        const {
          error
        } = await supabase.functions.invoke('create-free-subscription', {
          body: {
            plan_id: plan.id
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (error) throw error;
        toast({
          title: "Success!",
          description: "You're now on the free plan."
        });
        refresh();
      } else {
        // Create Stripe checkout - determine price_id based on billing type
        let priceId;
        if (plan.billing_type === 'one_time') {
          priceId = plan.stripe_price_id_one_time;
        } else {
          priceId = yearlyBilling && plan.stripe_price_id_yearly ? plan.stripe_price_id_yearly : plan.stripe_price_id_monthly;
        }
        
        // Capture Tolt referral ID
        const toltReferralId = getToltReferralId();
        console.log('Tolt Referral ID:', toltReferralId);
        
        const {
          data,
          error
        } = await supabase.functions.invoke('create-checkout', {
          body: {
            price_id: priceId,
            plan_id: plan.id,
            interval: yearlyBilling ? 'yearly' : 'monthly',
            tolt_referral: toltReferralId
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (error) throw error;

        // LinkedIn conversion tracking
        if (window.lintrk) {
          window.lintrk('track', { conversion_id: 24643052 });
        }

        // Redirect to Stripe Checkout
        if (data?.url) {
          window.location.href = data.url;
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCheckoutLoading(null);
    }
  };
  const isCurrentPlan = (planId: string) => {
    return subscription?.plan_id === planId;
  };
  const canonicalUrl = getCanonicalUrl('upgrade');
  const breadcrumbSchema = createBreadcrumbSchema([{
    name: "Home",
    url: getCanonicalUrl('')
  }, {
    name: "Upgrade",
    url: canonicalUrl
  }]);
  if (loading || verifyingPayment) {
    return <>
        <Helmet>
          <title>Upgrade - Quizabl</title>
          <link rel="canonical" href={canonicalUrl} />
        </Helmet>
        <div className="min-h-screen flex items-center justify-center flex-col gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          {verifyingPayment && <p className="text-muted-foreground">Verifying your payment...</p>}
        </div>
      </>;
  }
  if (autoCheckoutInProgress) {
    return <>
        <Helmet>
          <title>Checkout - Quizabl</title>
          <link rel="canonical" href={canonicalUrl} />
        </Helmet>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Preparing your checkout...</h2>
              <p className="text-muted-foreground">You'll be redirected to Stripe in a moment</p>
            </div>
          </div>
        </div>
      </>;
  }
  return <>
      <Helmet>
        <title>Upgrade - Quizabl | Choose Your Plan</title>
        <meta name="description" content="Choose the perfect Quizabl plan for your classroom. Get unlimited AI credits, premium features, and lifetime access." />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content="Upgrade to Quizabl Pro" />
        <meta property="og:description" content="Unlock unlimited AI credits, premium features, and lifetime access for your classroom." />
        <meta property="og:site_name" content="Quizabl" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content="Upgrade to Quizabl Pro" />
        <meta name="twitter:description" content="Unlock unlimited AI credits and premium features." />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      </Helmet>
      
      <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="text-center mb-8 md:mb-12">
          <h1 className="font-display italic text-4xl sm:text-5xl mb-4">Choose Your Plan</h1>
          <p className="text-base sm:text-xl text-muted-foreground mb-8">
            Select the perfect plan for your needs
          </p>
          
          <div className="hidden flex items-center justify-center gap-4">
            <Label htmlFor="billing-toggle" className={!yearlyBilling ? 'font-semibold' : ''}>
              Monthly
            </Label>
            <Switch id="billing-toggle" checked={yearlyBilling} onCheckedChange={setYearlyBilling} />
            <Label htmlFor="billing-toggle" className={yearlyBilling ? 'font-semibold' : ''}>
              Yearly <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </Label>
          </div>
        </div>

        {/* Discount Banner */}
        <div className="mb-8 max-w-4xl mx-auto">
          <DiscountBanner location="upgrade" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {plans.map(plan => {
            const price = plan.billing_type === 'one_time' ? plan.price_one_time : yearlyBilling && plan.price_yearly ? plan.price_yearly : plan.price_monthly;
            const currentPlan = isCurrentPlan(plan.id);
            return <Card key={plan.id} className={`relative ${currentPlan ? 'border-primary' : ''}`}>
                {currentPlan && <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Current Plan</Badge>
                  </div>}
                
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {!plan.is_free_tier && <Sparkles className="w-5 h-5 text-primary" />}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="mb-6">
                    {plan.billing_type === 'one_time' ? <div className="text-4xl font-bold">
                        ${price}
                        <span className="text-lg text-muted-foreground"> one-time</span>
                        <p className="text-sm text-primary mt-2">Lifetime Access</p>
                      </div> : <>
                        <div className="text-4xl font-bold">
                          ${price}
                          <span className="text-lg text-muted-foreground">
                            /{yearlyBilling ? 'year' : 'month'}
                          </span>
                        </div>
                        {yearlyBilling && plan.price_yearly > 0 && <p className="text-sm text-muted-foreground mt-1">
                            ${(plan.price_yearly / 12).toFixed(2)}/month billed annually
                          </p>}
                      </>}
                  </div>

                  <div className="space-y-3">
                    {(plan.plan_pricing_features && plan.plan_pricing_features.length > 0 ? plan.plan_pricing_features.sort((a, b) => a.display_order - b.display_order).map(feature => ({
                    text: feature.feature_text,
                    highlighted: feature.is_highlighted
                  })) : plan.features?.map(feature => ({
                    text: `${feature.display_name}: ${feature.feature_value}`,
                    highlighted: false
                  })))?.map((feature, index) => <div key={index} className="flex items-start gap-2">
                        {feature.highlighted ? <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" /> : <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                        <span className="text-sm">
                          {feature.text}
                        </span>
                      </div>)}
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col gap-3">
                  <Button className="w-full" variant={currentPlan ? "outline" : "default"} onClick={() => handleSubscribe(plan)} disabled={checkoutLoading === plan.id || currentPlan}>
                    {checkoutLoading === plan.id ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </> : currentPlan ? 'Current Plan' : plan.is_free_tier ? 'Get Started' : plan.billing_type === 'one_time' ? 'Buy Lifetime Access' : 'Upgrade Now'}
                  </Button>
                  {plan.billing_type === 'one_time' && !currentPlan && (
                    <a 
                      href="/terms-of-service#billing" 
                      className="flex items-center justify-center gap-2 text-sm text-accent font-medium hover:underline"
                    >
                      <Shield className="w-4 h-4" />
                      <span>14-Day Money-Back Guarantee</span>
                    </a>
                  )}
                </CardFooter>
              </Card>;
          })}
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground">
          
          <p className="mt-2">Questions? Contact us at support@quizabl.com</p>
        </div>
      </div>
      </div>
    </>;
}