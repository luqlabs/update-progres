import { useState } from "react";
import { Play } from "lucide-react";

export const ActionShowcase = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-transparent via-accent/5 to-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Video section hidden temporarily for update */}
        {/* <div className="text-center mb-12">
          <h3 className="font-display italic text-3xl md:text-5xl text-foreground mb-4 max-w-2xl mx-auto">Experience the future of quiz creation</h3>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            See how Quizabl transforms your teaching workflow.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-16 space-y-4">
          <div className="relative w-full rounded-md overflow-hidden shadow-none border-2 border-border" style={{ paddingBottom: "56.25%" }}>
            {!isVideoPlaying ? (
              <button 
                onClick={() => setIsVideoPlaying(true)} 
                className="absolute top-0 left-0 w-full h-full group cursor-pointer border-4 border-foreground/30 rounded-md overflow-hidden" 
                aria-label="Play video"
              >
                <img 
                  src="https://img.youtube.com/vi/-7RIiMi3DBY/maxresdefault.jpg" 
                  alt="Quizabl Launch Video Thumbnail" 
                  className="absolute top-0 left-0 w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-none">
                  <Play className="w-8 h-8 text-foreground ml-1" fill="currentColor" />
                </div>
              </button>
            ) : (
              <iframe 
                className="absolute top-0 left-0 w-full h-full" 
                src="https://www.youtube.com/embed/-7RIiMi3DBY?rel=0&modestbranding=1&autoplay=1" 
                title="Quizabl Launch Video" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen 
              />
            )}
          </div>
        </div> */}

        {/* Story Section - hidden for now
        <div id="about" className="max-w-3xl mx-auto px-4">
          <div className="space-y-6 text-foreground">
            <h4 className="font-display italic text-3xl md:text-5xl text-foreground mb-4 max-w-2xl mx-auto">The story behind it..</h4>
            <p className="text-lg leading-relaxed">Hi there, my name is Putra. I built Quizabl because I was tired of fighting with software.</p>
            <p className="text-lg leading-relaxed">As an educator, I realized I was spending more time configuring quizzes such as clicking dropdowns, typing options, fixing settings than actually teaching. The "big" platforms felt like data entry jobs, and generic AI tools just dumped random questions that I couldn't easily fix.</p>
            <p className="text-lg leading-relaxed">
              I wanted a tool that worked like a Teaching Assistant. One where I could just say, "Here's my lesson, make a practice test," and it would just happen. And if I wanted to change something, I could just tell it to change, instead of navigating five menus. 
            </p>
            <p className="text-lg leading-relaxed">
              Quizabl isn't just a quiz maker. It's the first tool that actually listens to you.
            </p>
          </div>
        </div>
        */}
      </div>
    </section>
  );
};
