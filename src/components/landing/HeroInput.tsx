import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { TypewriterEffect } from "./TypewriterEffect";

const examplePrompts = [
  "Create a quiz about photosynthesis...",
  "Build flashcards for Spanish verbs...",
  "Make a matching game about world capitals...",
  "Create a quiz about Ancient Rome...",
  "Build flashcards for multiplication tables...",
];

export const HeroInput = () => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate("/auth")}
      className="group relative max-w-3xl mx-auto cursor-pointer animate-fade-in"
      style={{ animationDelay: "0.2s" }}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary opacity-30 blur-xl group-hover:opacity-50 transition-opacity rounded-md" />
      
      <div className="relative bg-background/80 backdrop-blur-sm border-2 border-border hover:border-primary/50 rounded-md p-6 transition-all group-hover:border-foreground/30">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-lg text-muted-foreground">
              <TypewriterEffect phrases={examplePrompts} />
            </div>
          </div>
          
          <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-xl flex items-center justify-center group-hover:bg-primary/90 transition-colors">
            <ArrowRight className="w-6 h-6 text-primary-foreground group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
