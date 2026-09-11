import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);
const clampText = (v: unknown, max: number): string | null =>
  typeof v === "string" ? v.slice(0, max) : null;
const toInt = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? Math.floor(v) : NaN;
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return json({ error: "Invalid request body" }, 400);

    const { action } = body as { action?: string };

    switch (action) {
      case "start_session": {
        const { app_id, student_name, total_questions } = body as Record<string, unknown>;
        if (!isUuid(app_id)) return json({ error: "Invalid app_id" }, 400);

        const name = clampText(student_name, 50)?.trim() ?? "";
        if (!name) return json({ error: "Name cannot be empty" }, 400);
        if (!/^[a-zA-Z0-9\s\-']+$/.test(name)) {
          return json({ error: "Name contains invalid characters" }, 400);
        }

        const total = toInt(total_questions, 0, 1000);
        if (total === null) return json({ error: "Invalid total_questions" }, 400);

        const { data: app } = await supabase
          .from("apps")
          .select("id, accepting_responses")
          .eq("id", app_id)
          .maybeSingle();

        if (!app) return json({ error: "Activity not found" }, 404);
        if (app.accepting_responses === false) {
          return json({ error: "This activity is no longer accepting responses" }, 403);
        }

        const { data: session, error } = await supabase
          .from("student_sessions")
          .insert({ app_id, student_name: name, total_questions: total })
          .select("id")
          .single();

        if (error) {
          console.error("start_session error:", error);
          return json({ error: "Failed to start session" }, 500);
        }
        return json({ session_id: session.id });
      }

      case "submit_response": {
        const b = body as Record<string, unknown>;
        if (!isUuid(b.session_id)) return json({ error: "Invalid session_id" }, 400);

        const { data: session } = await supabase
          .from("student_sessions")
          .select("id, completed_at")
          .eq("id", b.session_id)
          .maybeSingle();

        if (!session) return json({ error: "Session not found" }, 404);
        if (session.completed_at) return json({ error: "Session already completed" }, 403);

        const questionIndex = toInt(b.question_index, 0, 1000);
        if (questionIndex === null) return json({ error: "Invalid question_index" }, 400);

        const questionText = clampText(b.question_text, 2000);
        const studentAnswer = clampText(b.student_answer, 2000);
        if (!questionText || studentAnswer === null) {
          return json({ error: "Invalid question or answer text" }, 400);
        }

        const { error } = await supabase.from("student_responses").insert({
          session_id: b.session_id,
          question_index: questionIndex,
          question_text: questionText,
          student_answer: studentAnswer,
          correct_answer: clampText(b.correct_answer, 2000),
          is_correct: typeof b.is_correct === "boolean" ? b.is_correct : null,
          time_spent_seconds: toInt(b.time_spent_seconds, 0, 86400) ?? 0,
          hint_used: b.hint_used === true,
        });

        if (error) {
          console.error("submit_response error:", error);
          return json({ error: "Failed to save response" }, 500);
        }
        return json({ success: true });
      }

      case "complete_session": {
        const b = body as Record<string, unknown>;
        if (!isUuid(b.session_id)) return json({ error: "Invalid session_id" }, 400);

        const score = toInt(b.score, 0, 100000);
        if (score === null) return json({ error: "Invalid score" }, 400);

        const { data: session } = await supabase
          .from("student_sessions")
          .select("id, completed_at, total_questions")
          .eq("id", b.session_id)
          .maybeSingle();

        if (!session) return json({ error: "Session not found" }, 404);
        if (session.completed_at) return json({ success: true, already_completed: true });

        const total = b.total_questions === undefined
          ? session.total_questions
          : toInt(b.total_questions, 0, 1000);
        if (total === null) return json({ error: "Invalid total_questions" }, 400);

        const { error } = await supabase
          .from("student_sessions")
          .update({
            completed_at: new Date().toISOString(),
            score,
            total_questions: total,
          })
          .eq("id", b.session_id)
          .is("completed_at", null);

        if (error) {
          console.error("complete_session error:", error);
          return json({ error: "Failed to complete session" }, 500);
        }
        return json({ success: true });
      }

      case "get_results": {
        const b = body as Record<string, unknown>;
        if (!isUuid(b.session_id)) return json({ error: "Invalid session_id" }, 400);

        const { data: session } = await supabase
          .from("student_sessions")
          .select("started_at, completed_at, score, total_questions")
          .eq("id", b.session_id)
          .maybeSingle();

        if (!session) return json({ error: "Session not found" }, 404);

        const { data: responses } = await supabase
          .from("student_responses")
          .select(
            "id, question_index, question_text, student_answer, correct_answer, is_correct, time_spent_seconds, hint_used, answered_at",
          )
          .eq("session_id", b.session_id)
          .order("question_index", { ascending: true });

        return json({ session, responses: responses ?? [] });
      }

      case "get_leaderboard": {
        const b = body as Record<string, unknown>;
        if (!isUuid(b.app_id)) return json({ error: "Invalid app_id" }, 400);

        const { data: sessions } = await supabase
          .from("student_sessions")
          .select("id, student_name, score, total_questions, started_at, completed_at")
          .eq("app_id", b.app_id)
          .not("completed_at", "is", null)
          .order("score", { ascending: false })
          .order("completed_at", { ascending: true })
          .limit(20);

        const entries = await Promise.all(
          (sessions ?? []).map(async (s) => {
            const { count } = await supabase
              .from("student_responses")
              .select("*", { count: "exact", head: true })
              .eq("session_id", s.id)
              .not("is_correct", "is", null);
            return { ...s, total_questions: count || s.total_questions };
          }),
        );

        return json({ entries });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    console.error("play-data error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
