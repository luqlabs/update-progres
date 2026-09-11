import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { userId, action, role, credits, planId } = await req.json();

    if (!userId || !action) {
      throw new Error("Missing required fields");
    }

    let result;

    switch (action) {
      case "update_role":
        if (!role) throw new Error("Role is required");
        
        // First, delete existing role
        await supabaseClient
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        // Only insert if new role is admin
        if (role === "admin") {
      const { error: roleInsertError } = await supabaseClient
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (roleInsertError) throw roleInsertError;

      // Log the action
      await supabaseClient
        .from("admin_audit_log")
        .insert({
          admin_user_id: user.id,
          action: "update_role",
          target_user_id: userId,
          details: { new_role: "admin" },
        });
    }

    // Log role removal
    if (role === "user") {
      await supabaseClient
        .from("admin_audit_log")
        .insert({
          admin_user_id: user.id,
          action: "update_role",
          target_user_id: userId,
          details: { new_role: "user" },
        });
    }

        result = { success: true, message: "Role updated" };
        break;

      case "update_credits":
        if (credits === undefined) throw new Error("Credits value is required");

        const { error: creditsError } = await supabaseClient
          .from("usage_tracking")
          .upsert({ user_id: userId, credits }, { onConflict: "user_id" });

        if (creditsError) throw creditsError;

        // Log the action
        await supabaseClient
          .from("admin_audit_log")
          .insert({
            admin_user_id: user.id,
            action: "update_credits",
            target_user_id: userId,
            details: { credits },
          });

        result = { success: true, message: "Credits updated" };
        break;

      case "update_plan":
        if (!planId) throw new Error("Plan ID is required");

        // Get old subscription to fetch current plan
        const { data: oldSubscription } = await supabaseClient
          .from("user_subscriptions")
          .select("plan_id")
          .eq("user_id", userId)
          .maybeSingle();

        let newCreditLimit = 0;

        // Get new plan's credit limit
        const { data: newPlanFeature } = await supabaseClient
          .from("plan_features")
          .select("feature_value")
          .eq("plan_id", planId)
          .eq("feature_key", "credits")
          .maybeSingle();

        if (newPlanFeature && newPlanFeature.feature_value !== "unlimited") {
          newCreditLimit = parseInt(newPlanFeature.feature_value);
        }

        // Get current remaining credits
        const { data: currentUsage } = await supabaseClient
          .from("usage_tracking")
          .select("credits")
          .eq("user_id", userId)
          .maybeSingle();

        const currentCredits = currentUsage?.credits || 0;

        // Calculate rolled-over credits: current + new plan limit
        const rolledOverCredits = currentCredits + newCreditLimit;

        // Update subscription plan
        const { error: planError } = await supabaseClient
          .from("user_subscriptions")
          .upsert(
            {
              user_id: userId,
              plan_id: planId,
              status: "active",
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (planError) throw planError;

        // Update credits with rollover
        const { error: creditsUpdateError } = await supabaseClient
          .from("usage_tracking")
          .upsert(
            {
              user_id: userId,
              credits: rolledOverCredits,
              last_reset_date: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (creditsUpdateError) throw creditsUpdateError;

        // Log the action with credit details
        await supabaseClient
          .from("admin_audit_log")
          .insert({
            admin_user_id: user.id,
            action: "update_plan",
            target_user_id: userId,
            details: { 
              plan_id: planId,
              old_credits: currentCredits,
              new_plan_credits: newCreditLimit,
              rolled_over_total: rolledOverCredits,
            },
          });

        result = { 
          success: true, 
          message: `Plan updated. Credits rolled over: ${currentCredits} + ${newCreditLimit} = ${rolledOverCredits}` 
        };
        break;

      case "delete_user":
        // Prevent self-deletion
        if (userId === user.id) {
          throw new Error("Cannot delete your own account");
        }
        
        // Check if target user is an admin and if they're the last admin
        const { data: targetUserRoles } = await supabaseClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin");
        
        if (targetUserRoles && targetUserRoles.length > 0) {
          const { count: adminCount } = await supabaseClient
            .from("user_roles")
            .select("*", { count: 'exact', head: true })
            .eq("role", "admin");
          
          if (adminCount === 1) {
            throw new Error("Cannot delete the last admin user");
          }
        }
        
        // Delete user from auth.users (cascades to related tables)
        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);
        
        if (deleteError) throw deleteError;
        
        // Log the deletion action
        await supabaseClient
          .from("admin_audit_log")
          .insert({
            admin_user_id: user.id,
            action: "delete_user",
            target_user_id: userId,
            details: { deleted_at: new Date().toISOString() },
          });
        
        result = { success: true, message: "User deleted successfully" };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
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
