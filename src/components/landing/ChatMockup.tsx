import { Sparkles, FileText } from "lucide-react";

export const ChatMockup = () => {
  return (
    <div className="relative">
      {/* Decorative background elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
      
      {/* Chat Card */}
      <div className="relative bg-card border border-border rounded-md shadow-none overflow-hidden animate-fade-in" style={{ animationDelay: "0.3s" }}>
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">Quizabl AI</h4>
            <p className="text-xs text-muted-foreground">Always ready to help</p>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <div className="w-2 h-2 rounded-full bg-primary/50" />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          </div>
        </div>
        
        {/* Chat Messages */}
        <div className="p-5 space-y-4 bg-background/50">
          {/* User Message 1 */}
          <div className="flex justify-end animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="max-w-[85%] bg-primary text-primary-foreground px-4 py-3 rounded-md rounded-tr-sm shadow-none">
              <p className="text-sm">Here are my lecture notes. Create a quiz focusing on Macroeconomics.</p>
            </div>
          </div>
          
          {/* AI Message */}
          <div className="flex justify-start animate-fade-in" style={{ animationDelay: "0.8s" }}>
            <div className="max-w-[85%] bg-muted text-foreground px-4 py-3 rounded-md rounded-tl-sm border border-border">
              <p className="text-sm">I've analyzed your notes! I've created a 10-question quiz and a matching game. Would you like to adjust the difficulty?</p>
            </div>
          </div>
          
          {/* User Message 2 */}
          <div className="flex justify-end animate-fade-in" style={{ animationDelay: "1.1s" }}>
            <div className="max-w-[85%] bg-primary text-primary-foreground px-4 py-3 rounded-md rounded-tr-sm shadow-none">
              <p className="text-sm">Yes, make the last 3 questions harder.</p>
            </div>
          </div>
        </div>
        
        {/* Chat Input (decorative) */}
        <div className="px-5 py-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Type a message or paste content...</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
