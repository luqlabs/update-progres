import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

interface InstructionalSlideProps {
  content: string;
  onContinue: () => void;
  theme: any;
  isDarkTheme: boolean;
  isPreviewMode?: boolean;
}

const InstructionalSlide = ({
  content,
  onContinue,
  theme,
  isDarkTheme,
  isPreviewMode = false,
}: InstructionalSlideProps) => {
  return (
    <div>
      {isPreviewMode && (
        <div className="mb-3 flex items-center gap-2 text-sm">
          <BookOpen className="w-4 h-4" />
          <Badge variant="secondary">Instructional Slide</Badge>
        </div>
      )}
      
      <div
        className={`rounded-lg p-6 mb-6 ${
          isDarkTheme ? "bg-white/5 border border-white/10" : "bg-muted/50 border"
        }`}
      >
        <div
          className={`prose prose-lg max-w-none ${
            isDarkTheme ? "prose-invert" : ""
          }`}
        >
          {content.split('\n').map((paragraph, index) => (
            <p key={index} className={isDarkTheme ? "text-white" : "text-foreground"}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <Button
        onClick={onContinue}
        className={`w-full ${theme.button} text-white`}
      >
        Continue
      </Button>
    </div>
  );
};

export default InstructionalSlide;
