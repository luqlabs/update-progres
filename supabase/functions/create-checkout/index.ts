import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      return new Response(JSON.stringify({ error: 'User not authenticated or email not available' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { price_id, plan_id, interval, tolt_referral } = await req.json();
    
    // ALWAYS log request data for debugging
    console.log('📊 Create-checkout request:', { 
      price_id, 
      plan_id, 
      interval, 
      tolt_referral: tolt_referral || 'NOT_PROVIDED',
      user_email: user.email
    });

    if (tolt_referral) {
      console.log('✅ Tolt referral received:', tolt_referral);
    } else {
      console.log('ℹ️ No Tolt referral in request (normal for direct traffic)');
    }

    if (!price_id || !plan_id) {
      return new Response(JSON.stringify({ error: 'Price ID and Plan ID are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch plan to determine billing type
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('billing_type, name')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating checkout for plan:', plan.name, 'Type:', plan.billing_type, 'User:', user.email);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log('Existing customer found:', customerId);
    }

    // Build metadata object
    const sessionMetadata: Record<string, string> = {
      user_id: user.id,
      plan_id: plan_id,
      billing_type: plan.billing_type,
      interval: interval || 'monthly',
    };

    // Add tolt_referral if present
    if (tolt_referral) {
      sessionMetadata.tolt_referral = tolt_referral;
      console.log('✅ Adding Tolt referral to Stripe metadata:', tolt_referral);
    }

    // Log metadata before sending to Stripe
    console.log('📤 Stripe session metadata being sent:', JSON.stringify(sessionMetadata));

    // Build the base session config
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: plan.billing_type === 'subscription' ? 'subscription' : 'payment',
      allow_promotion_codes: true,
      success_url: `${req.headers.get('origin')}/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/upgrade?canceled=true`,
      metadata: sessionMetadata,
    };

    // Conditionally add metadata to Payment Intent OR Subscription
    if (plan.billing_type === 'subscription') {
      sessionConfig.subscription_data = {
        metadata: sessionMetadata,
      };
    } else {
      sessionConfig.payment_intent_data = {
        metadata: sessionMetadata,
      };
    }

    // Create checkout session with dynamic mode based on billing type
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('Checkout session created:', session.id, 'Mode:', session.mode);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in create-checkout:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
