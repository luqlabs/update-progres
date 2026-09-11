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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin role
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: hasAdminRole } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      name, 
      description, 
      billing_type,
      price_monthly, 
      price_yearly, 
      price_one_time,
      features 
    } = await req.json();

    console.log('Creating plan:', { name, billing_type, price_monthly, price_yearly, price_one_time });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Create Stripe Product
    const product = await stripe.products.create({
      name,
      description: description || undefined,
    });

    console.log('Stripe product created:', product.id);

    // Create Stripe Prices based on billing type
    let monthlyPrice = null;
    let yearlyPrice = null;
    let oneTimePrice = null;

    if (billing_type === 'subscription') {
      // Create recurring prices
      if (price_monthly > 0) {
        monthlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(price_monthly * 100),
          currency: 'usd',
          recurring: { interval: 'month' },
        });
        console.log('Monthly price created:', monthlyPrice.id);
      }

      if (price_yearly && price_yearly > 0) {
        yearlyPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(price_yearly * 100),
          currency: 'usd',
          recurring: { interval: 'year' },
        });
        console.log('Yearly price created:', yearlyPrice.id);
      }
    } else if (billing_type === 'one_time') {
      // Create one-time price (NO recurring parameter)
      if (price_one_time > 0) {
        oneTimePrice = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(price_one_time * 100),
          currency: 'usd',
          // Note: NO recurring parameter = one-time payment
        });
        console.log('One-time price created:', oneTimePrice.id);
      }
    }

    // Insert plan into database
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .insert({
        name,
        description,
        billing_type,
        price_monthly: billing_type === 'subscription' ? price_monthly : null,
        price_yearly: billing_type === 'subscription' ? price_yearly : null,
        price_one_time: billing_type === 'one_time' ? price_one_time : null,
        stripe_product_id: product.id,
        stripe_price_id_monthly: monthlyPrice?.id,
        stripe_price_id_yearly: yearlyPrice?.id,
        stripe_price_id_one_time: oneTimePrice?.id,
      })
      .select()
      .single();

    if (planError) {
      console.error('Database error:', planError);
      return new Response(JSON.stringify({ error: planError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert features
    if (features && features.length > 0) {
      const featureInserts = features.map((f: any) => ({
        plan_id: plan.id,
        feature_key: f.feature_key,
        feature_value: f.feature_value,
        feature_type: f.feature_type,
        display_name: f.display_name,
      }));

      const { error: featuresError } = await supabaseClient
        .from('plan_features')
        .insert(featureInserts);

      if (featuresError) {
        console.error('Features error:', featuresError);
      }
    }

    console.log('Plan created successfully:', plan.id);

    return new Response(
      JSON.stringify({
        success: true,
        plan,
        stripe_product_id: product.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in admin-create-stripe-plan:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
