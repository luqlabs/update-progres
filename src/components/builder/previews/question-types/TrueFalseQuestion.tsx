import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface TrueFalseQuestionProps {
  question: string;
  questionImage?: string;
  correctAnswer: string;
  selectedAnswer: string | null;
  showFeedback: boolean;
  onAnswer: (answer: string) => void;
  theme: any;
  isDarkTheme: boolean;
  feedbackMode?: 'full' | 'basic' | 'none';
}

const TrueFalseQuestion = ({
  question,
  questionImage,
  correctAnswer,
  selectedAnswer,
  showFeedback,
  onAnswer,
  theme,
  isDarkTheme,
  feedbackMode = 'full',
}: TrueFalseQuestionProps) => {
  const options = ["True", "False"];

  return (
    <div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4" role="group" aria-label="True or False">
        {options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === correctAnswer;
          const showAnswerVisually = feedbackMode === 'full';
          let buttonStyle = theme.button;

          if (showFeedback && feedbackMode !== 'none') {
            if (isSelected && isCorrect) {
              buttonStyle = theme.correct;
            } else if (isSelected && !isCorrect) {
              buttonStyle = theme.incorrect;
            } else if (isCorrect && showAnswerVisually) {
              buttonStyle = theme.correct;
            }
          }

          return (
            <Button
              key={option}
              onClick={() => !showFeedback && onAnswer(option)}
              disabled={showFeedback}
              aria-pressed={isSelected}
              className={`min-h-12 sm:h-20 md:h-24 text-base sm:text-lg md:text-xl ${buttonStyle} text-white focus:ring-2 focus:ring-offset-2`}
              variant="default"
            >
              {option}
              {showFeedback && isCorrect && (isSelected || showAnswerVisually) && (
                <CheckCircle className="w-6 h-6 ml-auto" />
              )}
              {showFeedback && isSelected && !isCorrect && (
                <XCircle className="w-6 h-6 ml-auto" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default TrueFalseQuestion;
