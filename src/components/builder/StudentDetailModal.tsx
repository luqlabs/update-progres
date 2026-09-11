import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Lightbulb } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StudentDetailModalProps {
  sessionId: string | null;
  onClose: () => void;
  appType?: string;
}

interface ResponseDetail {
  id: string;
  question_text: string;
  student_answer: string;
  correct_answer: string | null;
  is_correct: boolean | null;
  time_spent_seconds: number;
  hint_used: boolean;
  question_index: number;
}

const StudentDetailModal = ({ sessionId, onClose, appType = "quiz" }: StudentDetailModalProps) => {
  const [responses, setResponses] = useState<ResponseDetail[]>([]);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);

        // Fetch session info
        const { data: session } = await supabase
          .from("student_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        setSessionInfo(session);

        // Fetch all responses
        const { data: responsesData } = await supabase
          .from("student_responses")
          .select("*")
          .eq("session_id", sessionId)
          .order("question_index", { ascending: true });

        setResponses(responsesData || []);
      } catch (error) {
        console.error("Error fetching student details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [sessionId]);

  if (!sessionId) return null;

  // Helper to identify non-gradable questions
  const isNonGradableQuestion = (response: ResponseDetail) => {
    return response.correct_answer === null && response.is_correct === null;
  };

  // Deduplicate responses - keep only the latest attempt per question
  const uniqueResponses = responses.reduce((acc, response) => {
    const existing = acc.find(r => r.question_index === response.question_index);
    if (!existing) {
      acc.push(response);
    }
    // If duplicate exists, keep the later one (assumes later in array = more recent)
    return acc;
  }, [] as ResponseDetail[]);

  // Calculate gradable question count (exclude non-gradable questions)
  const gradableQuestions = uniqueResponses.filter(r => !isNonGradableQuestion(r));
  const gradableCount = gradableQuestions.length;
  const totalTime = uniqueResponses.reduce((sum, r) => sum + (r.time_spent_seconds || 0), 0);
  const correctAnswers = gradableQuestions.filter(r => r.is_correct).length;
  const accuracy = gradableCount > 0 
    ? (correctAnswers / gradableCount) * 100 
    : 0;
  const hintsUsed = uniqueResponses.filter(r => r.hint_used).length;

  return (
    <Dialog open={!!sessionId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {sessionInfo?.student_name}'s Performance
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {appType === "flashcards" ? "Cards Reviewed" : "Score"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{sessionInfo?.score}/{gradableCount}</p>
                </CardContent>
              </Card>

              {appType === "quiz" && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{accuracy.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {correctAnswers}/{gradableCount} correct
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {totalTime < 60 
                      ? `${totalTime}s`
                      : totalTime % 60 === 0
                        ? `${Math.floor(totalTime / 60)}m`
                        : `${Math.floor(totalTime / 60)}m ${totalTime % 60}s`
                    }
                  </p>
                </CardContent>
              </Card>

              {appType === "quiz" && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Hints Used</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{hintsUsed}</p>
                    <p className="text-xs text-muted-foreground">
                      out of {gradableCount}
                    </p>
                  </CardContent>
                </Card>
              )}

              {appType === "flashcards" && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Per Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {uniqueResponses.length > 0 ? `${Math.floor(totalTime / uniqueResponses.length)}s` : "0s"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {appType === "matching" && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{accuracy.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {correctAnswers}/{gradableCount} correct
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Question by Question Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {appType === "flashcards" 
                    ? "Card Ratings"
                    : appType === "matching"
                    ? "Match Breakdown"
                    : "Detailed Breakdown"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {uniqueResponses.map((response, index) => (
                  <div
                    key={response.id}
                    className={`p-4 rounded-lg border ${
                      appType === "flashcards" 
                        ? "bg-muted border-muted" 
                        : isNonGradableQuestion(response)
                        ? "bg-muted border-muted"
                        : response.is_correct 
                        ? "bg-green-50 border-green-200" 
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {appType !== "flashcards" && !isNonGradableQuestion(response) && (
                        response.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                        )
                      )}
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">
                            {appType === "flashcards" ? "Card" : appType === "matching" ? "Pair" : "Q"}{index + 1}: {response.question_text}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {appType === "quiz" && response.hint_used && (
                              <Badge variant="outline" className="text-xs">
                                <Lightbulb className="w-3 h-3 mr-1" />
                                Hint
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {response.time_spent_seconds}s
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-2 text-sm">
                          {appType === "flashcards" ? (
                            <div>
                              <span className="text-muted-foreground">Self-Rating: </span>
                              <span className="font-medium capitalize">{response.student_answer}</span>
                            </div>
                          ) : (
                            <>
                              <div>
                                <span className="text-muted-foreground">
                                  {appType === "matching" ? "Matched with: " : "Student's answer: "}
                                </span>
                                <span className="font-medium">{response.student_answer}</span>
                              </div>
                              {!isNonGradableQuestion(response) && !response.is_correct && (
                                <div>
                                  <span className="text-muted-foreground">Correct answer: </span>
                                  <span className="font-medium text-green-600">{response.correct_answer}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentDetailModal;
