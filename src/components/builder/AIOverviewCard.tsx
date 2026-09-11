import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, RefreshCw, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";

interface AIOverviewCardProps {
  appId: string;
  hasAdvancedAnalytics: boolean;
  analyticsData: {
    appType?: string;
    totalPlays: number;
    avgScore: number | null;
    completionRate: number | null;
    avgCompletionTime: number;
    scoreDistribution: Array<{ range: string; count: number }>;
    commonMistakes: Array<{ question: string; errorRate: number; attempts: number }>;
    questionAnalysis: Array<{
      questionIndex: number;
      questionText: string;
      questionType: string;
      options: Array<{ text: string; isCorrect: boolean; count: number; percentage: number }>;
      totalResponses: number;
    }>;
  };
}

const AIOverviewCard = ({ appId, hasAdvancedAnalytics, analyticsData }: AIOverviewCardProps) => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingCached, setIsLoadingCached] = useState(true);

  // Load cached overview on mount
  useEffect(() => {
    if (!hasAdvancedAnalytics || !appId) {
      setIsLoadingCached(false);
      return;
    }

    const loadCached = async () => {
      try {
        const { data, error } = await supabase
          .from("analytics_summary")
          .select("ai_overview, ai_overview_generated_at")
          .eq("app_id", appId)
          .maybeSingle();

        if (!error && data?.ai_overview) {
          setOverview(data.ai_overview);
          setGeneratedAt(data.ai_overview_generated_at);
        }
      } catch (err) {
        console.error("Failed to load cached AI overview:", err);
      } finally {
        setIsLoadingCached(false);
      }
    };

    loadCached();
  }, [appId, hasAdvancedAnalytics]);

  const handleGenerate = async () => {
    if (!hasAdvancedAnalytics) {
      toast.error("AI Overview is a Pro feature. Upgrade to access!");
      navigate("/settings/billing");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-analytics-overview", {
        body: { analyticsData, appId },
      });

      if (error) {
        console.error("AI overview error:", error);
        toast.error("Failed to generate insights. Please try again.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setOverview(data.overview);
      setGeneratedAt(new Date().toISOString());
    } catch (err) {
      console.error("AI overview error:", err);
      toast.error("Failed to generate insights.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasAdvancedAnalytics) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
          <Lock className="w-6 h-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-medium">Upgrade to Pro for AI Insights</p>
          <Button size="sm" variant="default" onClick={() => navigate("/settings/billing")}>
            Upgrade
          </Button>
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Get AI-powered insights and teaching recommendations based on your students' performance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AI Overview
            </CardTitle>
            {generatedAt && !isGenerating && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(generatedAt), { addSuffix: true })}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant={overview ? "outline" : "default"}
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Analyzing...
              </>
            ) : overview ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingCached ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[75%]" />
          </div>
        ) : isGenerating ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[75%]" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        ) : overview ? (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>h2]:text-base [&>h2]:font-semibold [&>h2]:mt-4 [&>h2]:mb-2 [&>h2:first-child]:mt-0 [&>p]:text-sm [&>p]:text-muted-foreground [&>ul]:text-sm [&>ul]:text-muted-foreground [&>ol]:text-sm [&>ol]:text-muted-foreground">
            <ReactMarkdown>{overview}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Click "Generate Insights" to get AI-powered analysis of your students' performance with actionable teaching recommendations.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AIOverviewCard;
