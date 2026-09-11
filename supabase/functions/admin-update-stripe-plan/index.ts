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

    const { plan_id, name, description, price_monthly, price_yearly } = await req.json();

    console.log('Updating plan:', plan_id);

    // Get existing plan
    const { data: existingPlan } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (!existingPlan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Update Stripe Product
    if (existingPlan.stripe_product_id) {
      await stripe.products.update(existingPlan.stripe_product_id, {
        name,
        description: description || undefined,
      });
      console.log('Stripe product updated');
    }

    // Check if prices changed - if so, create new prices and archive old ones
    let monthlyPriceId = existingPlan.stripe_price_id_monthly;
    let yearlyPriceId = existingPlan.stripe_price_id_yearly;

    if (price_monthly !== existingPlan.price_monthly && existingPlan.stripe_product_id) {
      if (monthlyPriceId) {
        await stripe.prices.update(monthlyPriceId, { active: false });
      }
      if (price_monthly > 0) {
        const newPrice = await stripe.prices.create({
          product: existingPlan.stripe_product_id,
          unit_amount: Math.round(price_monthly * 100),
          currency: 'usd',
          recurring: { interval: 'month' },
        });
        monthlyPriceId = newPrice.id;
        console.log('New monthly price created:', monthlyPriceId);
      }
    }

    if (price_yearly !== existingPlan.price_yearly && existingPlan.stripe_product_id) {
      if (yearlyPriceId) {
        await stripe.prices.update(yearlyPriceId, { active: false });
      }
      if (price_yearly && price_yearly > 0) {
        const newPrice = await stripe.prices.create({
          product: existingPlan.stripe_product_id,
          unit_amount: Math.round(price_yearly * 100),
          currency: 'usd',
          recurring: { interval: 'year' },
        });
        yearlyPriceId = newPrice.id;
        console.log('New yearly price created:', yearlyPriceId);
      }
    }

    // Update plan in database
    const { data: updatedPlan, error: updateError } = await supabaseClient
      .from('subscription_plans')
      .update({
        name,
        description,
        price_monthly,
        price_yearly,
        stripe_price_id_monthly: monthlyPriceId,
        stripe_price_id_yearly: yearlyPriceId,
      })
      .eq('id', plan_id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Plan updated successfully');

    return new Response(
      JSON.stringify({ success: true, plan: updatedPlan }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in admin-update-stripe-plan:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
