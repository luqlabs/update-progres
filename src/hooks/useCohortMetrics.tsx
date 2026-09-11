import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppMetrics {
  appId: string;
  responses: number;
  recentResponses: number;
  avgScore: number | null; // 0..1
  lastResponseAt: string | null;
}

export interface CohortMetrics {
  loading: boolean;
  byApp: Record<string, AppMetrics>;
  bands: { struggling: number; developing: number; secure: number };
  medianScore: number | null; // 0..1
  completionRate: number | null; // 0..1
  responseCount: number;
  recentResponseCount: number;
  weekly: number[];
  termLabel: string;
  refresh: () => void;
}

const RECENT_DAYS = 7;

const termStart = () => {
  const now = new Date();
  const month = now.getMonth();
  return new Date(now.getFullYear(), month < 6 ? 0 : 6, 1);
};

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

interface SessionRow {
  app_id: string;
  score: number | null;
  total_questions: number | null;
  started_at: string;
  completed_at: string | null;
}

export const useCohortMetrics = (appIds: string[]): CohortMetrics => {
  const key = appIds.join(",");
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const ids = key ? key.split(",") : [];

    if (ids.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("student_sessions")
      .select("app_id, score, total_questions, started_at, completed_at")
      .in("app_id", ids)
      .gte("started_at", termStart().toISOString())
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load cohort metrics:", error);
          setRows([]);
        } else {
          setRows((data || []) as SessionRow[]);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  return useMemo(() => {
    const recentCutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

    const byApp: Record<string, AppMetrics> = {};
    const scoreBuckets: Record<string, number[]> = {};
    const allScores: number[] = [];
    let completed = 0;
    let recentResponseCount = 0;

    const weekly = new Array(8).fill(0) as number[];
    const nowWeekEnd = Date.now();

    rows.forEach(row => {
      const startedTs = new Date(row.started_at).getTime();

      if (!byApp[row.app_id]) {
        byApp[row.app_id] = {
          appId: row.app_id,
          responses: 0,
          recentResponses: 0,
          avgScore: null,
          lastResponseAt: null,
        };
      }
      const entry = byApp[row.app_id];
      entry.responses += 1;
      if (startedTs >= recentCutoff) {
        entry.recentResponses += 1;
        recentResponseCount += 1;
      }
      if (!entry.lastResponseAt || startedTs > new Date(entry.lastResponseAt).getTime()) {
        entry.lastResponseAt = row.started_at;
      }

      const weeksAgo = Math.floor((nowWeekEnd - startedTs) / (7 * 24 * 60 * 60 * 1000));
      if (weeksAgo >= 0 && weeksAgo < 8) weekly[7 - weeksAgo] += 1;

      if (row.completed_at) completed += 1;

      if (row.completed_at && row.total_questions && row.total_questions > 0 && row.score !== null) {
        const pct = Math.max(0, Math.min(1, row.score / row.total_questions));
        allScores.push(pct);
        if (!scoreBuckets[row.app_id]) scoreBuckets[row.app_id] = [];
        scoreBuckets[row.app_id].push(pct);
      }
    });

    Object.entries(scoreBuckets).forEach(([appId, scores]) => {
      if (byApp[appId] && scores.length > 0) {
        byApp[appId].avgScore = scores.reduce((s, n) => s + n, 0) / scores.length;
      }
    });

    const bands = { struggling: 0, developing: 0, secure: 0 };
    allScores.forEach(pct => {
      if (pct < 0.5) bands.struggling += 1;
      else if (pct < 0.75) bands.developing += 1;
      else bands.secure += 1;
    });

    const now = new Date();
    const termLabel = `${now.getMonth() < 6 ? "Jan" : "Jul"}–${now.getMonth() < 6 ? "Jun" : "Dec"} ${now.getFullYear()}`;

    return {
      loading,
      byApp,
      bands,
      medianScore: median(allScores),
      completionRate: rows.length > 0 ? completed / rows.length : null,
      responseCount: rows.length,
      recentResponseCount,
      weekly,
      termLabel,
      refresh,
    };
  }, [rows, loading, refresh]);
};
