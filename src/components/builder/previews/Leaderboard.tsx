import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Target, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardProps {
  appId: string;
  currentSessionId?: string | null;
  onBack: () => void;
  theme: any;
}

interface LeaderboardEntry {
  id: string;
  student_name: string;
  score: number;
  total_questions: number;
  completed_at: string;
  started_at: string;
}

const Leaderboard = ({ appId, currentSessionId, onBack, theme }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_sessions',
          filter: `app_id=eq.${appId}`,
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appId]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("play-data", {
        body: { action: "get_leaderboard", app_id: appId },
      });

      if (error) throw error;

      setEntries((data?.entries ?? []) as LeaderboardEntry[]);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };


  const calculateTimeTaken = (entry: LeaderboardEntry) => {
    const start = new Date(entry.started_at).getTime();
    const end = new Date(entry.completed_at).getTime();
    const seconds = Math.floor((end - start) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const getAccuracy = (entry: LeaderboardEntry) => {
    return Math.round((entry.score / entry.total_questions) * 100);
  };

  if (loading) {
    return (
      <div className={`h-full ${theme.bg} flex items-center justify-center`}>
        <p className={theme.text}>Loading leaderboard...</p>
      </div>
    );
  }

  return (
    <div className={`h-full ${theme.bg} p-3 sm:p-6 overflow-y-auto`}>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Button onClick={onBack} className={theme.buttonSecondary} size="sm">
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme.text} flex items-center gap-2`}>
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 flex-shrink-0" />
              <span className="truncate">Leaderboard</span>
            </h2>
            <p className={`text-xs sm:text-sm ${theme.muted}`}>
              Top {entries.length} performers
            </p>
          </div>
        </div>

        {/* Leaderboard Table */}
        <Card className={`${theme.card} border-2 ${theme.border} overflow-hidden`}>
          {entries.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <p className={`${theme.muted} text-sm`}>No completed sessions yet. Be the first!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {/* Header Row */}
              <div className={`grid grid-cols-8 md:grid-cols-12 gap-1 sm:gap-2 md:gap-4 p-2 sm:p-3 md:p-4 font-semibold text-xs md:text-sm ${theme.text} bg-muted/10`}>
                <div className="col-span-1 text-center">Rank</div>
                <div className="col-span-3 md:col-span-4">Player</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="hidden md:block md:col-span-2 text-center">Accuracy</div>
                <div className="col-span-2 md:col-span-3 text-center">Time</div>
              </div>

              {/* Data Rows */}
              {entries.map((entry, index) => {
                const rank = index + 1;
                const medal = getMedalIcon(rank);
                const isCurrentUser = entry.id === currentSessionId;
                
                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-8 md:grid-cols-12 gap-1 sm:gap-2 md:gap-4 p-2 sm:p-3 md:p-4 items-center transition-colors ${
                      isCurrentUser
                        ? "bg-primary/20 border-l-4 border-primary"
                        : "hover:bg-muted/5"
                    }`}
                  >
                    <div className="col-span-1 flex justify-center">
                      <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full font-bold ${
                        rank <= 3 ? "text-xl sm:text-2xl" : `text-xs sm:text-sm ${theme.text}`
                      }`}>
                        {medal || rank}
                      </div>
                    </div>
                    
                    <div className="col-span-3 md:col-span-4 min-w-0">
                      <p className={`font-semibold ${theme.text} truncate text-xs sm:text-sm`}>
                        {entry.student_name}
                        {isCurrentUser && (
                          <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs px-1 py-0">
                            You
                          </Badge>
                        )}
                      </p>
                    </div>
                    
                    <div className="col-span-2 text-center">
                      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                          <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                          <span className={`font-bold ${theme.text} text-xs sm:text-sm`}>
                            {entry.score}/{entry.total_questions}
                          </span>
                        </div>
                        <Badge className="md:hidden text-[10px] px-1 py-0" variant={getAccuracy(entry) >= 80 ? "default" : "secondary"}>
                          {getAccuracy(entry)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="hidden md:block md:col-span-2 text-center">
                      <Badge
                        variant={getAccuracy(entry) >= 80 ? "default" : "secondary"}
                        className="font-semibold text-xs"
                      >
                        {getAccuracy(entry)}%
                      </Badge>
                    </div>
                    
                    <div className="col-span-2 md:col-span-3 text-center">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                        <span className={`${theme.muted} text-[10px] sm:text-xs md:text-sm`}>
                          {calculateTimeTaken(entry)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
