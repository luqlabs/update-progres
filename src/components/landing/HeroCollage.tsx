import { MessageSquare, Sparkles, Share2, BarChart3 } from "lucide-react";
import askImg from "@/assets/landing/collage-ask.jpg";
import generateImg from "@/assets/landing/collage-generate.jpg";
import shareImg from "@/assets/landing/collage-share.jpg";
import diagnoseImg from "@/assets/landing/collage-diagnose.jpg";

const cards = [
  { label: "Ask", icon: MessageSquare, img: askImg, offset: "md:mt-16" },
  { label: "Generate", icon: Sparkles, img: generateImg, offset: "md:mt-0" },
  { label: "Share", icon: Share2, img: shareImg, offset: "md:mt-24" },
  { label: "Diagnose", icon: BarChart3, img: diagnoseImg, offset: "md:mt-8" },
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
