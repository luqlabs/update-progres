import { MessageSquare, Sparkles, Share2, BarChart3 } from "lucide-react";
import imgAsk from "@/assets/landing/hero-ask.webp";

const cards = [
  { label: "Ask", icon: MessageSquare, img: imgAsk, offset: "md:mt-16" },
  { label: "Generate", icon: Sparkles, img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800", offset: "md:mt-0" },
  { label: "Share", icon: Share2, img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800", offset: "md:mt-24" },
  { label: "Diagnose", icon: BarChart3, img: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800", offset: "md:mt-8" },
];

export const HeroCollage = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 items-start">
      {cards.map((card, i) => (
        <figure
          key={card.label}
          className={`relative overflow-hidden rounded-xl shadow-none animate-fade-in ${card.offset} ${
            i % 2 === 1 ? "mt-8 md:mt-0" : ""
          }`}
          style={{ animationDelay: `${0.15 + i * 0.1}s` }}
        >
          <img
            src={card.img}
            alt=""
            loading="lazy"
            width={768}
            height={1024}
            className="w-full h-[220px] sm:h-[300px] md:h-[340px] object-cover"
          />
          <figcaption className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-2 rounded-md bg-card/95 backdrop-blur px-2.5 py-1.5 font-nav text-[11px] font-semibold uppercase tracking-[0.12em] text-nav-ink shadow-none">
              <card.icon className="w-3.5 h-3.5" />
              {card.label}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
};

export default HeroCollage;
