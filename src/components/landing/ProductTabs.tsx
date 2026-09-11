import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, Layers, Shuffle, PencilRuler, BarChart3 } from "lucide-react";
import quizzesImg from "@/assets/landing/product-quizzes.png.asset.json";
import flashcardsImg from "@/assets/landing/product-flashcards.png.asset.json";
import shareImg from "@/assets/landing/collage-share.jpg";
import diagnoseImg from "@/assets/landing/collage-diagnose.jpg";
import analyticsImg from "@/assets/landing/product-analytics.jpg";

const products = [
  {
    id: "quizzes",
    label: "Quizzes",
    icon: ListChecks,
    img: quizzesImg.url,
    title: "Pre-lecture quizzes, built by conversation",
    body: "Describe the topic or drop in your lecture notes, and get a well-formed quiz in minutes. Multiple choice, true/false, fill-in-the-blank, short answer and open-ended — mixed exactly how you want it.",
  },
  {
    id: "flashcards",
    label: "Flashcards",
    icon: Layers,
    img: flashcardsImg.url,
    title: "Pre-reading that students actually finish",
    body: "Turn a chapter or slide deck into a flashcard set students can run through on their phone before the session, with no account to create.",
  },
  {
    id: "matching",
    label: "Matching games",
    icon: Shuffle,
    img: shareImg,
    title: "Terminology drilling without the busywork",
    body: "Pair terms with definitions, structures with functions, statutes with principles. Ideal for the vocabulary-heavy first weeks of a unit.",
  },
  {
    id: "editing",
    label: "Manual editing",
    icon: PencilRuler,
    img: diagnoseImg,
    title: "Full control over every question",
    body: "Start from scratch or edit anything the assistant produced. Rewrite stems, reorder options, change the correct answer, add explanations — the editor is always yours.",
  },
  {
    id: "analytics",
    label: "Cohort analytics",
    icon: BarChart3,
    img: analyticsImg,
    title: "See the gap before you teach it",
    body: "Question-level results show which concepts your cohort missed, so the next lecture starts where the misunderstanding actually is.",
  },
];

export const ProductTabs = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(products[0].id);
  const current = products.find((p) => p.id === active) ?? products[0];

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            One platform
          </span>
          <h2 className="font-display italic text-3xl md:text-5xl leading-[1.1] text-foreground mt-3">
            A connected experience for lecturers and students
          </h2>
        </div>


        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={`inline-flex items-center gap-2 rounded-md border px-3.5 py-2 font-nav text-[13px] font-medium transition-colors ${
                active === p.id
                  ? "border-nav-ink bg-nav-ink text-background"
                  : "border-border bg-card text-nav-ink hover:bg-secondary"
              }`}
            >
              <p.icon className="w-3.5 h-3.5" />
              {p.label}
            </button>
          ))}
        </div>

        <div key={current.id} className="grid md:grid-cols-5 gap-8 md:gap-10 items-center animate-fade-in">
          <div className="overflow-hidden rounded-xl border border-border bg-card order-1 md:col-span-3">
            <img
              src={current.img}
              alt={current.title}
              loading="lazy"
              width={1200}
              height={896}
              className="w-full h-[280px] md:h-[540px] object-contain object-top"
            />
          </div>
          <div className="order-2 md:col-span-2">

            <h3 className="font-display italic text-2xl md:text-4xl text-foreground mb-4">{current.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{current.body}</p>
            <button
              onClick={() => navigate("/auth")}
              className="font-nav text-[13px] font-semibold rounded-md bg-nav-ink text-background px-4 py-2 hover:opacity-90 transition-opacity"
            >
              Try it free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductTabs;
