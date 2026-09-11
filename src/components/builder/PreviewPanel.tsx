import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, AlertCircle } from "lucide-react";
import { AppConfig } from "@/pages/Builder";
import QuizPreview from "./previews/QuizPreview";
import FlashcardsPreview from "./previews/FlashcardsPreview";
import MatchingGamePreview from "./previews/MatchingGamePreview";
import PreviewThemePicker, { ThemeKey } from "./PreviewThemePicker";

interface PreviewPanelProps {
  config: AppConfig | null;
  appId?: string | null;
  onConfigUpdate?: (config: AppConfig) => void;
}

const PreviewPanel = ({ config, appId, onConfigUpdate }: PreviewPanelProps) => {
  if (!config) {
    return (
      <Card className="h-full flex items-center justify-center p-8 bg-background shadow-none">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-secondary rounded-full flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
            <p className="text-muted-foreground">
              Describe your activity in the chat to see a preview here
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const handleThemeChange = (theme: ThemeKey) => {
    if (onConfigUpdate) {
      onConfigUpdate({ ...config, theme });
    }
  };

  return (
    <Card className="builder-preview-panel h-full shadow-none relative flex flex-col">
      {onConfigUpdate && (
        <div className="flex items-center justify-end gap-3 px-4 py-2 border-b bg-background/60 backdrop-blur-sm">
          <PreviewThemePicker value={config.theme} onChange={handleThemeChange} />
        </div>
      )}
      <ScrollArea className="flex-1 p-4 pb-12">
        {config.type === "quiz" && <QuizPreview config={config} isPreviewMode={true} appId={appId} onConfigUpdate={onConfigUpdate} />}
        {config.type === "flashcards" && <FlashcardsPreview config={config} />}
        {config.type === "matching" && <MatchingGamePreview config={config} />}
      </ScrollArea>
      <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-muted/80 backdrop-blur-sm border-t">
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
          <AlertCircle className="w-3 h-3" />
          AI-generated content may contain errors. Review before sharing.
        </p>
      </div>
    </Card>
  );
};

export default PreviewPanel;
