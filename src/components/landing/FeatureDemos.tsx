import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Minus } from "lucide-react";
const showcaseContent = [{
  id: "create",
  label: "Build",
  headline: "From conversation to pre lecture activity",
  description: "Describe your lecture topic and learning outcomes. Quizabl drafts a complete pre assessment in seconds, then you refine it by chatting or editing questions directly.",
  gif: "/demo-create-play.gif"
}, {
  id: "customize",
  label: "Refine",
  headline: "Adjust difficulty and format by asking",
  description: "Raise the rigour, rewrite distractors, switch question types, or change the theme. No rebuilding, no clicking through settings.",
  gif: "/demo-theme-customization.gif"
}, {
  id: "analytics",
  label: "Insight",
  headline: "See the gap before you teach it",
  description: "Question level results show exactly which concepts your cohort hasn't grasped, so you can reshape the session before you walk in.",
  gif: "/demo-analytics.gif"
}];

export const FeatureDemos = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  useEffect(() => {
    showcaseContent.forEach(item => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => new Set(prev).add(item.gif));
      };
      img.src = item.gif;
    });
  }, []);
  const currentGif = activeFeature ? showcaseContent.find(item => item.id === activeFeature)?.gif : showcaseContent[0].gif;
  return <section className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="font-display italic text-3xl md:text-5xl text-foreground mb-4 max-w-2xl mx-auto">See how it works in practice</h3>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">Build, refine, and read the results. The full workflow a lecturer runs before a session.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left side - Accordion list */}
            <div className="space-y-0">
              {showcaseContent.map(item => {
              const isActive = activeFeature === item.id;
              return <div key={item.id} className="border-t border-border last:border-b">
                    <button onClick={() => setActiveFeature(isActive ? null : item.id)} className="w-full flex items-center justify-between py-6 text-left group font-light">
                      <h5 className="text-xl md:text-2xl font-semibold text-foreground tracking-tighter group-hover:text-primary transition-colors">
                        {item.headline}
                      </h5>
                      {isActive ? <Minus className="w-6 h-6 text-primary flex-shrink-0 ml-4" /> : <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary flex-shrink-0 ml-4 transition-colors" />}
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${isActive ? 'max-h-40 pb-6' : 'max-h-0'}`}>
                      <p className="text-muted-foreground leading-relaxed pr-10">
                        {item.description}
                      </p>
                    </div>
                  </div>;
            })}
            </div>

            {/* Right side - GIF preview */}
            <div className="relative rounded-md overflow-hidden shadow-none bg-muted/50 border border-border lg:sticky lg:top-8">
              {!loadedImages.has(currentGif || '') && <Skeleton className="w-full aspect-video" />}
              <img src={currentGif} alt="Feature demo" className={`w-full h-auto transition-opacity duration-300 ${loadedImages.has(currentGif || '') ? 'opacity-100' : 'opacity-0'}`} />
            </div>
          </div>
        </div>
      </div>
    </section>;
};