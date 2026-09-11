import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { share_code, student_name } = await req.json();

    if (!share_code || typeof share_code !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid share_code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Look up the app
    const { data: app, error: appError } = await supabase
      .from("apps")
      .select("id, config, theme, teacher_id, accepting_responses")
      .eq("share_code", share_code)
      .single();

    if (appError || !app) {
      return new Response(
        JSON.stringify({ error: "Activity not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check teacher's custom_branding feature
    const { data: subData } = await supabase
      .from("user_subscriptions")
      .select("plan_id")
      .eq("user_id", app.teacher_id)
      .eq("status", "active")
      .single();

    let showBranding = true; // show "Powered by" by default
    if (subData) {
      const { data: featureData } = await supabase
        .from("plan_features")
        .select("feature_value")
        .eq("plan_id", subData.plan_id)
        .eq("feature_key", "custom_branding")
        .single();

      if (featureData?.feature_value === "true") {
        showBranding = false; // teacher has custom branding → hide "Powered by"
      }
    }

    // Base response (load request)
    const response: Record<string, unknown> = {
      app_id: app.id,
      config: app.config,
      accepting_responses: app.accepting_responses !== false,
      show_branding: showBranding,
    };

    // 3. If student_name provided → start session
    if (student_name !== undefined && student_name !== null) {
      const trimmedName = String(student_name).trim();

      if (!trimmedName) {
        return new Response(
          JSON.stringify({ error: "Name cannot be empty" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (trimmedName.length > 50) {
        return new Response(
          JSON.stringify({ error: "Name must be 50 characters or less" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const namePattern = /^[a-zA-Z0-9\s\-']+$/;
      if (!namePattern.test(trimmedName)) {
        return new Response(
          JSON.stringify({ error: "Name can only contain letters, numbers, spaces, hyphens, and apostrophes" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check max_monthly_plays limit
      if (subData) {
        const { data: playsFeature } = await supabase
          .from("plan_features")
          .select("feature_value")
          .eq("plan_id", subData.plan_id)
          .eq("feature_key", "max_monthly_plays")
          .single();

        const maxPlays = playsFeature?.feature_value;

        if (maxPlays && maxPlays !== "unlimited") {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { data: teacherApps } = await supabase
            .from("apps")
            .select("id")
            .eq("teacher_id", app.teacher_id);

          if (teacherApps && teacherApps.length > 0) {
            const appIds = teacherApps.map((a: { id: string }) => a.id);

            const { count } = await supabase
              .from("student_sessions")
              .select("*", { count: "exact", head: true })
              .in("app_id", appIds)
              .gte("started_at", startOfMonth.toISOString());

            if (count !== null && count >= parseInt(maxPlays)) {
              return new Response(
                JSON.stringify({ error: "This teacher has reached their monthly play limit. Please try again next month." }),
                { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          }
        }
      }

      // Calculate total questions
      const config = app.config as Record<string, unknown>;
      const questions = config?.questions as unknown[] | undefined;
      const cards = config?.cards as unknown[] | undefined;
      const pairs = config?.pairs as unknown[] | undefined;
      const totalQuestions = questions?.length || cards?.length || pairs?.length || 0;

      // Insert session
      const { data: session, error: sessionError } = await supabase
        .from("student_sessions")
        .insert({
          app_id: app.id,
          student_name: trimmedName,
          total_questions: totalQuestions,
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Session creation error:", sessionError);
        return new Response(
          JSON.stringify({ error: "Failed to start session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      response.session_id = session.id;
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("validate-play-session error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
