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

    const { price_id_monthly, price_id_yearly } = await req.json();

    if (!price_id_monthly) {
      return new Response(JSON.stringify({ error: 'Monthly price ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Importing plan from Stripe Price IDs:', { price_id_monthly, price_id_yearly });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Fetch monthly price details
    const monthlyPrice = await stripe.prices.retrieve(price_id_monthly);
    
    if (!monthlyPrice.active) {
      return new Response(JSON.stringify({ error: 'Monthly price is not active in Stripe' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch product details
    const productId = typeof monthlyPrice.product === 'string' 
      ? monthlyPrice.product 
      : monthlyPrice.product.id;
    const product = await stripe.products.retrieve(productId);

    console.log('Fetched product from Stripe:', product.id);

    // Validate yearly price if provided
    let yearlyPrice = null;
    if (price_id_yearly) {
      yearlyPrice = await stripe.prices.retrieve(price_id_yearly);
      
      if (!yearlyPrice.active) {
        return new Response(JSON.stringify({ error: 'Yearly price is not active in Stripe' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate both prices belong to same product
      const yearlyProductId = typeof yearlyPrice.product === 'string'
        ? yearlyPrice.product
        : yearlyPrice.product.id;
      
      if (yearlyProductId !== productId) {
        return new Response(JSON.stringify({ error: 'Monthly and yearly prices must belong to the same product' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Insert plan into database
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .insert({
        name: product.name,
        description: product.description || '',
        price_monthly: monthlyPrice.unit_amount ? monthlyPrice.unit_amount / 100 : 0,
        price_yearly: yearlyPrice?.unit_amount ? yearlyPrice.unit_amount / 100 : 0,
        stripe_product_id: productId,
        stripe_price_id_monthly: price_id_monthly,
        stripe_price_id_yearly: price_id_yearly,
        stripe_import_source: 'imported',
        last_stripe_sync: new Date().toISOString(),
        is_free_tier: false,
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

    console.log('Plan imported successfully:', plan.id);

    return new Response(
      JSON.stringify({
        success: true,
        plan,
        stripe_product_id: productId,
        stripe_dashboard_url: `https://dashboard.stripe.com/products/${productId}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in admin-import-stripe-plan:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
