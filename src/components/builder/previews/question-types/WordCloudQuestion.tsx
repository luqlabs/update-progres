import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Cloud } from "lucide-react";
import ReactWordcloud from "react-wordcloud";

interface WordCloudQuestionProps {
  question: string;
  selectedAnswer: string | null;
  showFeedback: boolean;
  onAnswer: (answer: string) => void;
  theme: any;
  isDarkTheme: boolean;
  isPreviewMode?: boolean;
  wordCloudData?: { text: string; value: number }[];
}

const WordCloudQuestion = ({
  question,
  selectedAnswer,
  showFeedback,
  onAnswer,
  theme,
  isDarkTheme,
  isPreviewMode = false,
  wordCloudData = [],
}: WordCloudQuestionProps) => {
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

  const totalResponses = wordCloudData.reduce((sum, word) => sum + word.value, 0);

  return (
    <div>
      {isPreviewMode && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <Cloud className="w-4 h-4" />
          <span className="text-muted-foreground">Word Cloud Question</span>
        </div>
      )}
      
      <h3
        className={`text-base md:text-lg lg:text-xl font-semibold mb-4 md:mb-6 ${
          isDarkTheme ? "text-white" : "text-foreground"
        }`}
      >
        <span dir="auto">{question}</span>
      </h3>

      {!showFeedback ? (
        <div className="space-y-4">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your response (a few words)..."
            disabled={showFeedback}
            className={`text-base md:text-lg min-h-[100px] focus:ring-2 focus:ring-offset-2 ${
              isDarkTheme ? "bg-white/10 text-white border-white/30" : ""
            }`}
            maxLength={100}
          />
          <div className="text-sm text-muted-foreground">
            {inputValue.length}/100 characters
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className={`w-full min-h-12 ${theme.button} text-white`}
          >
            Submit Response
          </Button>
        </div>
      ) : (
        <div>
          {selectedAnswer && (
            <div className="mb-4">
              <Badge variant="default" className="text-base px-3 py-1">
                Your response: {selectedAnswer}
              </Badge>
            </div>
          )}
          
          {wordCloudData.length > 0 ? (
            <div className={`rounded-lg p-4 md:p-6 ${isDarkTheme ? "bg-white/5" : "bg-muted/50"}`}>
              <div className="h-[200px] sm:h-[250px] md:h-[300px]">
                <ReactWordcloud
                  words={wordCloudData}
                  options={{
                    rotations: 2,
                    rotationAngles: [-90, 0],
                    fontSizes: [16, 50],
                    colors: ["#9b87f5", "#7E69AB", "#6E59A5", "#D6BCFA", "#E5DEFF"],
                  }}
                />
              </div>
              <div className="mt-4 text-sm text-muted-foreground text-center">
                Total responses: {totalResponses}
              </div>
            </div>
          ) : (
            <div className={`rounded-lg p-6 text-center ${isDarkTheme ? "bg-white/5" : "bg-muted/50"}`}>
              <Cloud className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-muted-foreground">
                No responses yet. The word cloud will appear here once others respond.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WordCloudQuestion;
