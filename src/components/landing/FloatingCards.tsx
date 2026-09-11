import { Share2, BarChart3, Timer, Lightbulb } from "lucide-react";

export const FloatingCards = () => {
  return (
    <>
      {/* Top Left - Share Instantly */}
      <div 
        className="hidden lg:block absolute left-0 xl:-left-8 top-8 z-10 animate-fade-in"
        style={{ animationDelay: "0.5s" }}
      >
        <div 
          className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-md p-4 shadow-none w-48"
          style={{ 
            transform: "rotate(-4deg)",
            animation: "float 6s ease-in-out infinite"
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Share Instantly</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            One link, no student accounts needed
          </p>
        </div>
      </div>

      {/* Top Right - Spot Knowledge Gaps */}
      <div 
        className="hidden lg:block absolute right-0 xl:-right-8 top-16 z-10 animate-fade-in"
        style={{ animationDelay: "0.7s" }}
      >
        <div 
          className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-md p-4 shadow-none w-52"
          style={{ 
            transform: "rotate(5deg)",
            animation: "float 5s ease-in-out infinite 0.5s"
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm font-semibold text-foreground">Spot Knowledge Gaps</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            See which questions students miss most
          </p>
        </div>
      </div>

      {/* Bottom Left - Timed Challenges */}
      <div 
        className="hidden xl:block absolute left-4 bottom-12 z-10 animate-fade-in"
        style={{ animationDelay: "0.9s" }}
      >
        <div 
          className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-md p-4 shadow-none w-48"
          style={{ 
            transform: "rotate(3deg)",
            animation: "float 7s ease-in-out infinite 1s"
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Timed Challenges</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Add countdown timers per question
          </p>
        </div>
      </div>

      {/* Bottom Right - Built-in Explanations */}
      <div 
        className="hidden xl:block absolute right-4 bottom-20 z-10 animate-fade-in"
        style={{ animationDelay: "1.1s" }}
      >
        <div 
          className="bg-card/95 backdrop-blur-sm border border-border/50 rounded-md p-4 shadow-none w-52"
          style={{ 
            transform: "rotate(-4deg)",
            animation: "float 6s ease-in-out infinite 1.5s"
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm font-semibold text-foreground">Built-in Explanations</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Help students learn from mistakes
          </p>
        </div>
      </div>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(var(--rotation, 0deg)); }
          50% { transform: translateY(-10px) rotate(var(--rotation, 0deg)); }
        }
      `}</style>
    </>
  );
};
