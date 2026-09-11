import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3 } from "lucide-react";

interface PollQuestionProps {
  question: string;
  questionImage?: string;
  options: string[];
  selectedAnswer: string | null;
  showFeedback: boolean;
  onAnswer: (answer: string) => void;
  theme: any;
  isDarkTheme: boolean;
  isPreviewMode?: boolean;
  pollResults?: { [key: string]: number };
}

const PollQuestion = ({
  question,
  questionImage,
  options,
  selectedAnswer,
  showFeedback,
  onAnswer,
  theme,
  isDarkTheme,
  isPreviewMode = false,
  pollResults = {},
}: PollQuestionProps) => {
  const totalVotes = Object.values(pollResults).reduce((sum, count) => sum + count, 0);

  return (
    <div>
      {isPreviewMode && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <BarChart3 className="w-4 h-4" />
          <span className="text-muted-foreground">Poll Question (no right/wrong)</span>
        </div>
      )}
      
      <h3
        className={`text-base md:text-lg lg:text-xl font-semibold mb-4 md:mb-6 ${
          isDarkTheme ? "text-white" : "text-foreground"
        }`}
      >
        <span dir="auto">{question}</span>
      </h3>

      {/* Question Image */}
      {questionImage && (
        <div className="mb-4 md:mb-6 flex justify-center">
          <img
            src={questionImage}
            alt="Question illustration"
            className="max-h-48 md:max-h-64 rounded-lg object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="space-y-3">
        {options.map((option) => {
          const votes = pollResults[option] || 0;
          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          const isSelected = selectedAnswer === option;

          return (
            <div key={option} className="space-y-2">
              <Button
                onClick={() => !showFeedback && onAnswer(option)}
                disabled={showFeedback}
                variant={isSelected ? "default" : "outline"}
                className={`w-full justify-start text-left h-auto py-3 px-3 md:px-4 min-h-12 text-sm md:text-base focus:ring-2 focus:ring-offset-2 ${
                  isDarkTheme
                    ? isSelected
                      ? theme.button
                      : "bg-white/10 hover:bg-white/20 text-white border-white/30"
                    : ""
                }`}
              >
                <span dir="auto" className="whitespace-normal break-words">{option}</span>
                {showFeedback && totalVotes > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {votes} votes ({percentage.toFixed(0)}%)
                  </Badge>
                )}
              </Button>
              {showFeedback && totalVotes > 0 && (
                <Progress value={percentage} className="h-2" />
              )}
            </div>
          );
        })}
      </div>

      {showFeedback && totalVotes > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          Total responses: {totalVotes}
        </div>
      )}
    </div>
  );
};

export default PollQuestion;
