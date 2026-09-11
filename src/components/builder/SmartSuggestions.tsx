import { Sparkles, Plus, Shuffle, FileText, Link, BookOpen } from "lucide-react";
import { AppConfig } from "@/pages/Builder";

interface DocumentContext {
  fileName: string;
  text: string;
  characterCount: number;
  wasTruncated: boolean;
}

interface UrlContext {
  url: string;
  hostname: string;
  title?: string;
  text: string;
  characterCount: number;
  wasTruncated: boolean;
}

interface SmartSuggestionsProps {
  currentConfig: AppConfig | null;
  onSuggestionClick: (suggestion: string) => void;
  documentContext?: DocumentContext | null;
  urlContext?: UrlContext | null;
}

const SmartSuggestions = ({ 
  currentConfig, 
  onSuggestionClick,
  documentContext,
  urlContext
}: SmartSuggestionsProps) => {
  const getContextualSuggestions = (): { icon: any; text: string }[] => {
    const hasSource = documentContext || urlContext;
    const sourceName = documentContext?.fileName || urlContext?.hostname || "source";
    
    // Source-aware suggestions when document/URL is attached
    if (hasSource && !currentConfig) {
      return [
        { icon: BookOpen, text: "Generate quiz from this content" },
        { icon: BookOpen, text: "Create flashcards from this" },
        { icon: BookOpen, text: "Make a matching game from key terms" },
      ];
    }

    if (!currentConfig) {
      return [
        { icon: Sparkles, text: "Create a quiz on research methodology" },
        { icon: Sparkles, text: "Make flashcards for business English" },
        { icon: Sparkles, text: "Generate a compliance training quiz" },
      ];
    }

    const suggestions: { icon: any; text: string }[] = [];

    // Source-aware suggestions when content exists AND source is attached
    if (hasSource) {
      if (currentConfig.type === "quiz") {
        suggestions.push({ icon: BookOpen, text: "Add 5 more questions from source" });
        suggestions.push({ icon: Shuffle, text: "Create harder questions from source" });
      } else if (currentConfig.type === "flashcards") {
        suggestions.push({ icon: BookOpen, text: "Add more cards from source" });
        suggestions.push({ icon: Shuffle, text: "Create quiz from these flashcards" });
      } else if (currentConfig.type === "matching") {
        suggestions.push({ icon: BookOpen, text: "Add more pairs from source" });
        suggestions.push({ icon: Shuffle, text: "Convert to quiz format" });
      }
      return suggestions;
    }

    // Default suggestions without source
    if (currentConfig.type === "quiz") {
      const questionCount = currentConfig.questions?.length || 0;
      if (questionCount < 15) {
        suggestions.push({ icon: Plus, text: "Add 5 more questions" });
      }
      suggestions.push({ icon: Shuffle, text: "Add hint to all questions" });
    } else if (currentConfig.type === "flashcards") {
      suggestions.push({ icon: Plus, text: "Add 10 more cards" });
      suggestions.push({ icon: Shuffle, text: "Create related quiz from these cards" });
    } else if (currentConfig.type === "matching") {
      suggestions.push({ icon: Plus, text: "Add more pairs" });
      suggestions.push({ icon: Shuffle, text: "Convert to quiz format" });
    }

    return suggestions;
  };

  const suggestions = getContextualSuggestions();

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion, idx) => {
        const Icon = suggestion.icon;
        return (
          <button
            key={idx}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60 hover:bg-secondary text-xs text-foreground transition-colors"
          >
            <Icon className="w-3 h-3" />
            {suggestion.text}
          </button>
        );
      })}
    </div>
  );
};

export default SmartSuggestions;
