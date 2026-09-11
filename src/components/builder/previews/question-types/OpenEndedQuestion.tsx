import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface OpenEndedQuestionProps {
  question: string;
  selectedAnswer: string | null;
  showFeedback: boolean;
  onAnswer: (answer: string) => void;
  theme: any;
  isDarkTheme: boolean;
  isPreviewMode?: boolean;
}

const OpenEndedQuestion = ({
  question,
  selectedAnswer,
  showFeedback,
  onAnswer,
  theme,
  isDarkTheme,
  isPreviewMode = false,
}: OpenEndedQuestionProps) => {
  const [inputValue, setInputValue] = useState("");

  // Reset input when moving to a new question (selectedAnswer becomes null)
  useEffect(() => {
    if (selectedAnswer === null) {
      setInputValue("");
    }
  }, [selectedAnswer, question]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onAnswer(inputValue.trim());
    }
  };

  return (
    <div>
      {isPreviewMode && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" />
          <span className="text-muted-foreground">Open-ended Question (for teacher review)</span>
        </div>
      )}
      
      <h3
        className={`text-base md:text-lg lg:text-xl font-semibold mb-4 md:mb-6 ${
          isDarkTheme ? "text-white" : "text-foreground"
        }`}
      >
        <span dir="auto">{question}</span>
      </h3>

      <div className="space-y-4">
        <Textarea
          value={showFeedback ? selectedAnswer || "" : inputValue}
          onChange={(e) => !showFeedback && setInputValue(e.target.value)}
          placeholder="Type your detailed response..."
          disabled={showFeedback}
          className={`text-base md:text-lg min-h-[150px] sm:min-h-[200px] focus:ring-2 focus:ring-offset-2 ${
            isDarkTheme ? "bg-white/10 text-white border-white/30" : ""
          }`}
          maxLength={1000}
        />
        
        <div className="text-sm text-muted-foreground">
          {showFeedback ? selectedAnswer?.length : inputValue.length}/1000 characters
        </div>

        {!showFeedback && (
          <Button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className={`w-full min-h-12 ${theme.button} text-white`}
          >
            Submit Response
          </Button>
        )}

        {showFeedback && (
          <div className={`rounded-lg p-4 ${isDarkTheme ? "bg-white/5" : "bg-muted/50"}`}>
            <Badge variant="secondary">Response saved for teacher review</Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenEndedQuestion;
