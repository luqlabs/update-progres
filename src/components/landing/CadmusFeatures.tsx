import { Target, MessageSquare, FileText, Shield } from "lucide-react";

const benefits = [
  {
    icon: Target,
    text: "Spot the gaps in your cohort before the lecture, not after the exam.",
  },
  {
    icon: MessageSquare,
    text: "No student logins, no setup — one link works on any device.",
  },
  {
    icon: FileText,
    text: "Works with the material you already have: PDFs, slides, notes or a URL.",
  },
  {
    icon: Shield,
    text: "Minutes, not hours. Build, edit and share in a single sitting.",
  },
];

export const CadmusFeatures = () => {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            Why choose Quizabl for your institution?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div 
              key={i} 
              className="animate-fade-in bg-white rounded-xl p-8 shadow-sm border border-black/5 hover:shadow-md transition-shadow" 
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <div className="w-10 h-10 rounded bg-[#fdf3c7] flex items-center justify-center mb-6">
                <b.icon className="w-5 h-5 text-yellow-700" />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground font-medium">
                {b.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CadmusFeatures;
