import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Trophy, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AnalyticsPanel from "@/components/builder/AnalyticsPanel";
import Leaderboard from "@/components/builder/previews/Leaderboard";
import { AppConfig } from "./Builder";
import { useFeatures } from "@/hooks/useFeatures";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";

const Analytics = () => {
  const navigate = useNavigate();
  const { appId } = useParams();
  const { hasFeature } = useFeatures();
  const hasAdvancedAnalytics = hasFeature('advanced_analytics');
  const [viewMode, setViewMode] = useState<'analytics' | 'leaderboard'>('analytics');

  const theme = {
    bg: "bg-background",
    card: "bg-card",
    border: "border-border",
    text: "text-foreground",
    muted: "text-muted-foreground",
    button: "bg-primary text-primary-foreground hover:bg-primary/90",
    buttonSecondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
  };

  const { data: appData, isLoading } = useQuery({
    queryKey: ['analytics-app', appId],
    queryFn: async () => {
      if (!appId) throw new Error('No app ID');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from("apps")
        .select("*")
        .eq("id", appId)
        .eq("teacher_id", session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!appId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });

  const appConfig = appData?.config as unknown as AppConfig | null;
  const appTitle = appData?.title || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-none sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/builder/${appId}`)}
                className="flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex-1 sm:flex-initial">
                <h1 className="text-xl sm:text-2xl font-bold truncate">Analytics</h1>
                {isLoading ? (
                  <Skeleton className="h-4 w-32 mt-1" />
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{appTitle}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant={viewMode === 'analytics' ? 'default' : 'outline'}
              onClick={() => setViewMode('analytics')}
              className="flex-1 sm:flex-initial"
              size="sm"
            >
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'leaderboard' ? 'default' : 'outline'}
                    onClick={() => {
                      if (!hasAdvancedAnalytics) {
                        toast.error("Leaderboard is a Pro feature. Upgrade to access!");
                        navigate("/settings/billing");
                        return;
                      }
                      setViewMode('leaderboard');
                    }}
                    disabled={!hasAdvancedAnalytics}
                    className="relative flex-1 sm:flex-initial"
                    size="sm"
                  >
                    <Trophy className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Leaderboard</span>
                    {!hasAdvancedAnalytics && <Lock className="w-3 h-3 ml-1" />}
                  </Button>
                </TooltipTrigger>
                {!hasAdvancedAnalytics && (
                  <TooltipContent>
                    <p>Upgrade to Pro to access leaderboard</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {appId && (
          viewMode === 'analytics' ? (
            <AnalyticsPanel appId={appId} appConfig={appConfig} />
          ) : (
            <Leaderboard 
              appId={appId} 
              onBack={() => setViewMode('analytics')}
              theme={theme}
            />
          )
        )}
      </main>
    </div>
  );
};

export default Analytics;
