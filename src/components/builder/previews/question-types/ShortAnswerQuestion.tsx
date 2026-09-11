import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";

interface ShortAnswerQuestionProps {
  question: string;
  questionImage?: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
  selectedAnswer: string | null;
  showFeedback: boolean;
  onAnswer: (answer: string) => void;
  theme: any;
  isDarkTheme: boolean;
  isPreviewMode?: boolean;
}

const ShortAnswerQuestion = ({
  question,
  questionImage,
  correctAnswer,
  acceptedAnswers,
  selectedAnswer,
  showFeedback,
  onAnswer,
  theme,
  isDarkTheme,
  isPreviewMode = false,
}: ShortAnswerQuestionProps) => {
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

  // Check against all accepted answers
  const answersToCheck = acceptedAnswers && acceptedAnswers.length > 0 
    ? acceptedAnswers 
    : [correctAnswer];
  
  const isCorrect = answersToCheck.some(
    (answer) => selectedAnswer?.toLowerCase().trim() === answer.toLowerCase().trim()
  );

  return (
    <div>
      {isPreviewMode && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Correct answer:</span>
          <Badge variant="default">{correctAnswer}</Badge>
          {acceptedAnswers && acceptedAnswers.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {acceptedAnswers.slice(1).map((alt, i) => (
                <Badge key={i} variant="outline">
                  {alt}
                </Badge>
              ))}
            </div>
          )}
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

      <div className="space-y-4">
        <Input
          aria-label="Your answer"
          value={showFeedback ? selectedAnswer || "" : inputValue}
          onChange={(e) => !showFeedback && setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !showFeedback) {
              handleSubmit();
            }
          }}
          placeholder="Type your answer..."
          disabled={showFeedback}
          className={`text-base md:text-lg min-h-12 focus:ring-2 focus:ring-offset-2 ${isDarkTheme ? "bg-white/10 text-white border-white/30" : ""}`}
        />

        {!showFeedback && (
          <Button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            aria-label="Submit answer"
            className={`w-full min-h-12 ${theme.button} text-white`}
          >
            Submit Answer
          </Button>
        )}
      </div>
    </div>
  );
};

export default ShortAnswerQuestion;
