import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { analyticsData, appId } = await req.json();
    if (!analyticsData) {
      return new Response(JSON.stringify({ error: "Missing analytics data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an educational analytics advisor for university lecturers. Based on the quiz/assessment results provided, generate a concise, actionable overview.

Structure your response with these sections using markdown headers:
## 📊 Performance Summary
Brief overview of overall results.

## ⚠️ Areas of Concern
Key areas where students struggled, referencing specific questions or topics.

## 💡 Teaching Recommendations
Concrete, actionable suggestions to improve student understanding.

## ✅ Positive Highlights
What went well — praise strong areas.

Guidelines:
- Use an academic but approachable tone
- Be specific — reference actual question content and error rates
- Keep it under 300 words
- If data is limited (few participants), note that insights may not be statistically significant
- For flashcards, focus on mastery levels; for matching, focus on pair success rates`;

    const userPrompt = `Here is the analytics data for a ${analyticsData.appType || "quiz"} assessment:

**Overall Metrics:**
- Total Participants: ${analyticsData.totalPlays || 0}
- Average Score: ${analyticsData.avgScore != null ? `${Math.round(analyticsData.avgScore)}%` : "N/A"}
- Completion Rate: ${analyticsData.completionRate != null ? `${Math.round(analyticsData.completionRate)}%` : "N/A"}
- Average Completion Time: ${analyticsData.avgCompletionTime ? `${Math.floor(analyticsData.avgCompletionTime / 60)}m ${analyticsData.avgCompletionTime % 60}s` : "N/A"}

**Score Distribution:**
${analyticsData.scoreDistribution?.map((b: any) => `- ${b.range}: ${b.count} students`).join("\n") || "No distribution data"}

**Common Mistakes (sorted by error rate):**
${analyticsData.commonMistakes?.slice(0, 10).map((m: any) => `- "${m.question}" — Error rate: ${Math.round(m.errorRate)}%, Attempts: ${m.attempts}`).join("\n") || "No mistake data"}

**Question Analysis (lowest accuracy first):**
${analyticsData.questionAnalysis?.slice(0, 10).map((q: any) => {
  const correctCount = q.options?.filter((o: any) => o.isCorrect)?.reduce((s: number, o: any) => s + o.count, 0) || 0;
  const accuracy = q.totalResponses > 0 ? Math.round((correctCount / q.totalResponses) * 100) : 0;
  return `- Q${q.questionIndex + 1}: "${q.questionText}" — Accuracy: ${accuracy}%, Responses: ${q.totalResponses}`;
}).join("\n") || "No question analysis data"}

Please provide your analysis.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate insights" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const overview = result.choices?.[0]?.message?.content || "Unable to generate insights.";

    // Persist to analytics_summary if appId provided
    if (appId) {
      try {
        const serviceClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await serviceClient
          .from("analytics_summary")
          .update({ ai_overview: overview, ai_overview_generated_at: new Date().toISOString() })
          .eq("app_id", appId);
      } catch (saveErr) {
        console.error("Failed to persist AI overview:", saveErr);
        // Don't fail the request if save fails
      }
    }

    return new Response(JSON.stringify({ overview }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-analytics-overview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
