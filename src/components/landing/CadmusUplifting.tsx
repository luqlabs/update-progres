import { BookOpen, CheckSquare, Layers, BarChart } from "lucide-react";
import imgCreate from "@/assets/landing/collage-ask.jpg";
import imgMark from "@/assets/landing/collage-generate.jpg";
import imgManage from "@/assets/landing/collage-share.jpg";
import imgAnalyse from "@/assets/landing/collage-diagnose.jpg";

const cards = [
  { id: "create", label: "CREATE", img: imgCreate, icon: BookOpen },
  { id: "mark", label: "MARK", img: imgMark, icon: CheckSquare },
  { id: "manage", label: "MANAGE", img: imgManage, icon: Layers },
  { id: "analyse", label: "ANALYSE", img: imgAnalyse, icon: BarChart },
];

export const CadmusUplifting = () => {
  return (
    <section className="py-24" style={{ backgroundColor: "#4a1525" }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center mb-16">
        <h2 className="font-display text-4xl md:text-5xl text-white mb-6">
          Uplifting Assessment
        </h2>
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          Quizabl enables universities to deliver pre-lecture activities end-to-end, in one streamlined platform.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div 
              key={card.id} 
              className="relative rounded-2xl overflow-hidden h-[300px] md:h-[400px] shadow-lg group cursor-pointer"
            >
              <img 
                src={card.img} 
                alt={card.label} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
              <div className="absolute bottom-4 left-4 bg-white rounded flex items-center gap-2 px-3 py-1.5 shadow-sm">
                <card.icon className="w-4 h-4 text-[#4a1525]" />
                <span className="text-[11px] font-bold tracking-widest text-[#4a1525] uppercase">
                  {card.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CadmusUplifting;
