import { useState, useRef } from "react";
import { Sparkles, ArrowRight, FileText, Link } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface DashboardHeroInputProps {
  canCreate: boolean;
  remainingApps: number | 'unlimited';
  onNavigate: (prompt: string) => void;
  onLimitReached: () => void;
}

export const DashboardHeroInput = ({ 
  canCreate, 
  remainingApps,
  onNavigate, 
  onLimitReached 
}: DashboardHeroInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    
    if (!canCreate) {
      onLimitReached();
      return;
    }
    
    // Check if user is onboarding and set localStorage flags
    const isOnboarding = localStorage.getItem('is_onboarding') === 'true';
    if (isOnboarding) {
      localStorage.setItem('onboarding_step', 'builder-chat');
    }
    
    onNavigate(trimmedInput);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto animate-fade-in onboarding-hero-input">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary opacity-20 blur-lg transition-opacity rounded-xl" />
      
      <div className="relative bg-card backdrop-blur-sm border border-border hover:border-primary/40 rounded-xl p-4 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your quiz, or upload a document in the builder..."
            className="flex-1 min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            disabled={!canCreate}
          />
          
          <Button
            onClick={handleSubmit}
            disabled={!canCreate || !input.trim()}
            size="icon"
            className="flex-shrink-0 w-10 h-10 bg-primary hover:bg-primary/90"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Feature hints */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>PDFs, DOCX, TXT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link className="w-3.5 h-3.5" />
            <span>Paste any URL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-powered</span>
          </div>
        </div>
        
        {canCreate && remainingApps !== 'unlimited' && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            {remainingApps} {remainingApps === 1 ? 'activity' : 'activities'} remaining
          </div>
        )}
      </div>
    </div>
  );
};
