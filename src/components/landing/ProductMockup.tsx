import { FileText, Sparkles, Send, Paperclip, ChevronLeft, ChevronRight, Pencil } from "lucide-react";

export const ProductMockup = () => {
  return (
    <div className="relative max-w-6xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
      {/* Glow Effect Behind */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-accent/10 to-transparent blur-3xl scale-110 -z-10" />
      
      {/* Main Dashboard Card */}
      <div 
        className="bg-card border border-border rounded-md shadow-none overflow-hidden"
        style={{
          transform: "perspective(1000px) rotateX(3deg)",
          transformOrigin: "center top"
        }}
      >
        {/* Browser Chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-primary/60" />
            <div className="w-3 h-3 rounded-full bg-accent/60" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-background rounded-lg px-4 py-1.5 text-sm text-muted-foreground flex items-center gap-2 max-w-md mx-auto">
              <span className="text-accent">🔒</span>
              <span>app.quizabl.com/builder</span>
            </div>
          </div>
        </div>

        {/* Two-Panel Content */}
        <div className="flex flex-col lg:flex-row min-h-[420px]">
          
          {/* Left Panel - Chat Interface */}
          <div className="flex-1 lg:w-[55%] p-5 border-b lg:border-b-0 lg:border-r border-border bg-background/50">
            {/* Chat Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">AI Assistant</span>
              </div>
              <div className="px-3 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                Credits: 15
              </div>
            </div>

            {/* Chat Messages Container */}
            <div className="space-y-4 mb-4">
              
              {/* Step 1: Document Attachment */}
              <div 
                className="opacity-0 animate-[document-appear_0.4s_ease-out_forwards]"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex justify-end">
                  <div className="bg-muted/80 border border-border rounded-xl px-4 py-3 max-w-[85%]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">lecture-psychology.pdf</p>
                        <p className="text-xs text-muted-foreground">124 pages • 2.4 MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: User Message */}
              <div 
                className="opacity-0 animate-[fade-in_0.4s_ease-out_forwards]"
                style={{ animationDelay: "0.9s" }}
              >
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-md rounded-tr-md px-4 py-3 max-w-[80%]">
                    <p className="text-sm">Create a quiz from this psychology lecture about learning theories</p>
                  </div>
                </div>
              </div>

              {/* Step 3: AI Thinking */}
              <div 
                className="opacity-0 animate-[fade-in_0.4s_ease-out_forwards]"
                style={{ animationDelay: "1.5s" }}
              >
                <div className="flex justify-start">
                  <div className="bg-muted rounded-md rounded-tl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-accent-foreground" />
                      </div>
                      <span className="text-sm text-muted-foreground">Analyzing your document</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0s" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0.2s" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: AI Response */}
              <div 
                className="opacity-0 animate-[fade-in_0.4s_ease-out_forwards]"
                style={{ animationDelay: "2.2s" }}
              >
                <div className="flex justify-start">
                  <div className="bg-muted rounded-md rounded-tl-md px-4 py-3 max-w-[90%]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-accent-foreground" />
                      </div>
                      <span className="text-xs font-medium text-accent">Quizabl AI</span>
                    </div>
                    <p className="text-sm text-foreground mb-2">
                      Done! I've created an <span className="font-semibold text-primary">8-question quiz</span> covering:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-2">
                      <li>• Classical conditioning (Pavlov)</li>
                      <li>• Operant conditioning (Skinner)</li>
                      <li>• Observational learning (Bandura)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 5: Quick Actions */}
              <div 
                className="opacity-0 animate-[fade-in_0.4s_ease-out_forwards]"
                style={{ animationDelay: "2.9s" }}
              >
                <div className="flex gap-2 flex-wrap">
                  {["+ Add more questions", "Make it harder", "Add explanations"].map((action) => (
                    <button 
                      key={action}
                      className="px-3 py-1.5 text-xs bg-background border border-border rounded-md text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div 
              className="opacity-0 animate-[fade-in_0.4s_ease-out_forwards]"
              style={{ animationDelay: "3.3s" }}
            >
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-4 py-3">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-sm text-muted-foreground">Describe what you want to create...</span>
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Send className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Quiz Preview */}
          <div 
            className="lg:w-[45%] p-5 bg-muted/30 opacity-0 animate-[slide-in-right_0.5s_ease-out_forwards]"
            style={{ animationDelay: "2.5s" }}
          >
            {/* Tab Bar */}
            <div className="flex gap-1 mb-4">
              {["Preview", "Edit", "Settings"].map((tab, i) => (
                <button 
                  key={tab}
                  className={`px-4 py-2 text-xs rounded-lg transition-colors ${
                    i === 0 
                      ? "bg-background text-foreground font-medium shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Quiz Card */}
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              {/* Quiz Header */}
              <div className="p-4 border-b border-border bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">Psychology 101 Quiz</h3>
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-md border border-primary text-primary">
                    Preview Mode
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Question 1 of 8</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="w-[12.5%] h-full bg-primary rounded-full" />
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="p-4">
                <p className="text-sm font-medium text-foreground mb-4">
                  What is classical conditioning as described by Ivan Pavlov?
                </p>

                {/* Answer Options */}
                <div className="space-y-2">
                  {[
                    "A. Learning through rewards and punishments",
                    "B. Pairing a neutral stimulus with an unconditioned stimulus",
                    "C. Learning by observing others",
                    "D. Trial and error learning"
                  ].map((option, i) => (
                    <button 
                      key={i}
                      className={`w-full text-left px-4 py-3 text-sm rounded-lg border transition-all ${
                        i === 1 
                          ? "bg-primary/10 border-primary text-foreground" 
                          : "bg-muted/50 border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-xs text-muted-foreground">1 / 8</span>
                  <button className="flex items-center gap-1 text-xs text-primary font-medium hover:text-primary/80 transition-colors">
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shadow underneath */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-4/5 h-8 bg-gradient-to-b from-foreground/5 to-transparent blur-xl" />
    </div>
  );
};
