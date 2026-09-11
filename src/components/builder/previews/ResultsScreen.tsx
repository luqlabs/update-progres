import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Lightbulb, Trophy, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppConfig } from "@/pages/Builder";

interface ResultsScreenProps {
  score: number;
  totalQuestions: number;
  config: AppConfig;
  sessionId?: string | null;
  studentName?: string;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
  theme: any;
}

interface StudentResponse {
  question_index: number;
  question_text: string;
  student_answer: string;
  correct_answer: string | null;
  is_correct: boolean | null;
  time_spent_seconds: number;
  hint_used: boolean;
  answered_at: string;
}

const ResultsScreen = ({
  score,
  totalQuestions,
  config,
  sessionId,
  studentName,
  onPlayAgain,
  onViewLeaderboard,
  theme,
}: ResultsScreenProps) => {
  const [responses, setResponses] = useState<StudentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTime, setTotalTime] = useState(0);

  const percentage = Math.round((score / totalQuestions) * 100);

  useEffect(() => {
    const fetchResponses = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        const { data: result, error } = await supabase.functions.invoke("play-data", {
          body: { action: "get_results", session_id: sessionId },
        });

        if (error) throw error;

        const sessionData = result?.session;
        const data = (result?.responses ?? []) as StudentResponse[];

        // Calculate total time from session timestamps
        if (sessionData?.started_at && sessionData?.completed_at) {
          const start = new Date(sessionData.started_at).getTime();
          const end = new Date(sessionData.completed_at).getTime();
          const totalSeconds = Math.floor((end - start) / 1000);
          setTotalTime(totalSeconds);
        }


        if (data && data.length > 0) {
          // Get unique responses (latest attempt for each question)
          const uniqueResponses = data.reduce((acc, curr) => {
            const existing = acc.find(r => r.question_index === curr.question_index);
            if (!existing || new Date(curr.answered_at) > new Date(existing.answered_at)) {
              return [...acc.filter(r => r.question_index !== curr.question_index), curr];
            }
            return acc;
          }, [] as StudentResponse[]);
          
          uniqueResponses.sort((a, b) => a.question_index - b.question_index);
          setResponses(uniqueResponses);
        }
      } catch (error) {
        console.error("Error fetching responses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [sessionId]);

  const getPerformanceMessage = () => {
    if (percentage === 100) return "🏆 Perfect Score! Outstanding!";
    if (percentage >= 80) return "🌟 Excellent Work!";
    if (percentage >= 60) return "👍 Good Job!";
    if (percentage >= 40) return "📚 Keep Practicing!";
    return "💪 Don't Give Up!";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper to check if a question is non-gradable
  const isNonGradableQuestion = (response: StudentResponse) => {
    // Non-gradable questions have null correct_answer and null is_correct
    return response.correct_answer === null && response.is_correct === null;
  };

  return (
    <div className={`h-full ${theme.bg} p-6 overflow-y-auto`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className={`${theme.card} p-8 text-center border-2 ${theme.border}`}>
          <Trophy className={`w-16 h-16 mx-auto mb-4 ${percentage >= 80 ? 'text-yellow-400' : theme.text}`} />
          <h2 className={`text-3xl font-bold mb-2 ${theme.text}`}>
            Quiz Complete! 🎉
          </h2>
          {studentName && (
            <p className={`text-lg mb-4 ${theme.muted}`}>
              Great work, {studentName}!
            </p>
          )}
          
          {/* Score Display */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            <div className={`p-4 rounded-lg ${theme.card} border ${theme.border}`}>
              <p className={`text-sm ${theme.muted} mb-1`}>Score</p>
              <p className={`text-3xl font-bold ${theme.text}`}>
                {score}/{totalQuestions}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${theme.card} border ${theme.border}`}>
              <p className={`text-sm ${theme.muted} mb-1`}>Accuracy</p>
              <p className={`text-3xl font-bold ${theme.text}`}>{percentage}%</p>
            </div>
            <div className={`p-4 rounded-lg ${theme.card} border ${theme.border}`}>
              <p className={`text-sm ${theme.muted} mb-1`}>Time</p>
              <p className={`text-3xl font-bold ${theme.text}`}>{formatTime(totalTime)}</p>
            </div>
          </div>

          <p className={`text-xl font-semibold ${theme.text}`}>
            {getPerformanceMessage()}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 px-4 sm:px-0">
            {config.allowRetakes !== false && (
              <Button onClick={onPlayAgain} className={theme.button}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
            )}
            {config.showLeaderboard !== false && (
              <Button onClick={onViewLeaderboard} className={config.allowRetakes !== false ? theme.buttonSecondary : theme.button}>
                <Trophy className="w-4 h-4 mr-2" />
                View Leaderboard
              </Button>
            )}
          </div>
        </Card>

        {/* Question Breakdown - Only show if enabled */}
        {config.showQuestionBreakdown !== false && !loading && responses.length > 0 && (
          <Card className={`${theme.card} p-6 border-2 ${theme.border}`}>
            <h3 className={`text-xl font-bold mb-4 ${theme.text}`}>
              Question Breakdown
            </h3>
            <div className="space-y-3">
              {responses.map((response, index) => {
                const isNonGradable = isNonGradableQuestion(response);
                
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      isNonGradable
                        ? `${theme.card} ${theme.border}`
                        : response.is_correct
                        ? "bg-green-500/10 border-green-500/50"
                        : "bg-red-500/10 border-red-500/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {!isNonGradable && (
                        response.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        )
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold mb-2 ${theme.text}`}>
                          Q{index + 1}: {response.question_text}
                        </p>
                        <div className={`${isNonGradable ? '' : 'grid grid-cols-1 md:grid-cols-2'} gap-2 text-sm`}>
                          <div>
                            <span className={`${theme.muted}`}>Your answer: </span>
                            <span className={`font-medium ${theme.text}`}>
                              {response.student_answer || "(No answer)"}
                            </span>
                          </div>
                          {!isNonGradable && (
                            <div>
                              <span className={`${theme.muted}`}>Correct answer: </span>
                              <span className={`font-medium text-green-500`}>
                                {response.correct_answer}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3 mt-2 text-xs">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {response.time_spent_seconds}s
                          </Badge>
                          {response.hint_used && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Lightbulb className="w-3 h-3" />
                              Hint used
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResultsScreen;
