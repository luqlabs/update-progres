import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface FillBlankQuestionProps {
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

const FillBlankQuestion = ({
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
}: FillBlankQuestionProps) => {
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

  // Normalize any sequence of 3+ underscores to a single blank marker
  const normalizedQuestion = question.replace(/_{3,}/g, '___BLANK___');
  const parts = normalizedQuestion.split('___BLANK___');
  
  // Enforce single blank rule - only use first blank if multiple exist
  const hasSingleBlank = parts.length === 2;
  const displayParts = hasSingleBlank ? parts : [parts[0], parts.slice(1).join(' ')];

  return (
    <div>
      {isPreviewMode && (
        <>
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
          {!hasSingleBlank && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Multiple blanks detected</AlertTitle>
              <AlertDescription>
                This question has multiple blank sequences. Only the first blank will be used. Please edit to have exactly one "___".
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

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
      
      <div className="mb-4 md:mb-6">
        <p
          className={`text-base md:text-lg lg:text-xl font-semibold ${
            isDarkTheme ? "text-white" : "text-foreground"
          }`}
        >
          {displayParts.map((part, index) => (
            <span key={index}>
              {part}
              {index < displayParts.length - 1 && (
                <Input
                  value={showFeedback ? selectedAnswer || "" : inputValue}
                  onChange={(e) => !showFeedback && setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !showFeedback) {
                      handleSubmit();
                    }
                  }}
                  placeholder="..."
                  disabled={showFeedback}
                  className={`inline-block w-32 sm:w-40 md:w-48 mx-1 md:mx-2 min-h-10 text-base focus:ring-2 focus:ring-offset-2 ${
                    isDarkTheme ? "bg-white/10 text-white border-white/30" : ""
                  }`}
                />
              )}
            </span>
          ))}
        </p>
      </div>

      {!showFeedback && (
        <Button
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
          className={`w-full min-h-12 ${theme.button} text-white`}
        >
          Submit Answer
        </Button>
      )}
    </div>
  );
};

export default FillBlankQuestion;
