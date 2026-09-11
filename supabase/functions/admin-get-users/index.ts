import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_seen: string | null;
  role: "admin" | "user";
  credits: number;
  apps_created: number;
  monthly_plays: number;
  plan_name: string | null;
  plan_id: string | null;
  subscription_status: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  is_free_tier: boolean | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Verify admin role
    const { data: isAdmin, error: roleError } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      throw new Error("Forbidden: Admin access required");
    }

    const { search, userId } = await req.json();

    // Build base query for profiles
    let profileQuery = supabaseClient
      .from("profiles")
      .select("id, email, full_name, created_at, last_seen");

    if (userId) {
      profileQuery = profileQuery.eq("id", userId);
    } else if (search) {
      profileQuery = profileQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: profiles, error: profilesError } = await profileQuery;

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Fetch related data separately for each user
    const users: UserData[] = await Promise.all(
      profiles.map(async (profile: any) => {
        // Get user role
        const { data: roleData } = await supabaseClient
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.id)
          .single();

        // Get credits via RPC (triggers monthly reset)
        const { data: currentCredits } = await supabaseClient
          .rpc("get_user_credits", { _user_id: profile.id });

        // Get remaining usage data
        const { data: usageData } = await supabaseClient
          .from("usage_tracking")
          .select("apps_created, monthly_plays")
          .eq("user_id", profile.id)
          .single();

        // Get subscription
        const { data: subData } = await supabaseClient
          .from("user_subscriptions")
          .select("status, plan_id, current_period_start, current_period_end, stripe_subscription_id")
          .eq("user_id", profile.id)
          .single();

        // Get plan name, free tier flag, and credit limit if subscription exists
        let planName = null;
        let isFreeTier = null;
        let planCredits = 5; // Default to free plan credits
        
        if (subData?.plan_id) {
          const { data: planData } = await supabaseClient
            .from("subscription_plans")
            .select("name, is_free_tier")
            .eq("id", subData.plan_id)
            .single();
          
          const { data: planFeature } = await supabaseClient
            .from("plan_features")
            .select("feature_value")
            .eq("plan_id", subData.plan_id)
            .eq("feature_key", "credits")
            .single();
          
          planName = planData?.name || null;
          isFreeTier = planData?.is_free_tier ?? null;
          planCredits = planFeature?.feature_value === "unlimited" 
            ? 999999 
            : parseInt(planFeature?.feature_value || "5");
        }

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          last_seen: profile.last_seen,
          role: roleData?.role || "user",
          credits: currentCredits ?? planCredits,
          apps_created: usageData?.apps_created ?? 0,
          monthly_plays: usageData?.monthly_plays ?? 0,
          plan_name: planName,
          plan_id: subData?.plan_id || null,
          subscription_status: subData?.status || null,
          current_period_start: subData?.current_period_start || null,
          current_period_end: subData?.current_period_end || null,
          stripe_subscription_id: subData?.stripe_subscription_id || null,
          is_free_tier: isFreeTier,
        };
      })
    );

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
