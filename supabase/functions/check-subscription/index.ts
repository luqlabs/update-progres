import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    logStep('Function started');

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY not set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    logStep('Stripe key verified');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      return new Response(JSON.stringify({ error: `Authentication error: ${userError.message}` }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user = userData.user;
    if (!user?.email) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    logStep('User authenticated', { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Check for ANY active subscription in database (free tier OR manually assigned)
    const { data: dbSubscription } = await supabaseClient
      .from('user_subscriptions')
      .select('*, subscription_plans!inner(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (dbSubscription) {
      logStep('Active subscription found in database', { 
        planName: dbSubscription.subscription_plans.name,
        isFree: dbSubscription.subscription_plans.is_free_tier,
        billingInterval: dbSubscription.billing_interval
      });
      return new Response(JSON.stringify({
        subscribed: true,
        plan_id: dbSubscription.plan_id,
        plan_name: dbSubscription.subscription_plans.name,
        is_free_tier: dbSubscription.subscription_plans.is_free_tier || false,
        billing_interval: dbSubscription.billing_interval,
        subscription_end: dbSubscription.current_period_end,
        status: dbSubscription.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Check Stripe for paid subscriptions
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep('No Stripe customer found');
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep('Found Stripe customer', { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let planId = null;
    let planName = null;
    let interval = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      
      // Get interval from price
      const priceInterval = subscription.items.data[0].price.recurring?.interval;
      interval = priceInterval === 'year' ? 'yearly' : 'monthly';
      
      logStep('Active subscription found', { 
        subscriptionId: subscription.id, 
        productId,
        endDate: subscriptionEnd,
        interval
      });

      // Find matching plan in database
      const { data: plan } = await supabaseClient
        .from('subscription_plans')
        .select('id, name')
        .eq('stripe_product_id', productId)
        .single();

      if (plan) {
        planId = plan.id;
        planName = plan.name;

        // Upsert subscription in database
        await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            plan_id: planId,
            status: 'active',
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: subscriptionEnd,
            billing_interval: interval,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,plan_id'
          });
      }
    } else {
      logStep('No active subscription found');
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      plan_id: planId,
      plan_name: planName,
      subscription_end: subscriptionEnd,
      billing_interval: interval,
      is_free_tier: false,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
