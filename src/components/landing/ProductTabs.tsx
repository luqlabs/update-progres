import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, Layers, Shuffle, PencilRuler, BarChart3, ArrowRight } from "lucide-react";
import quizzesImg from "@/assets/landing/tab_quizzes_real_v2.jpg";
import flashcardsImg from "@/assets/landing/tab_flashcards_real_v2.jpg";
import matchingImg from "@/assets/landing/tab_matching_real_v2.jpg";
import editingImg from "@/assets/landing/tab_editing_real_v2.jpg";
import analyticsImg from "@/assets/landing/Cohort analytics.jpeg";

const products = [
  {
    id: "quizzes",
    label: "Quizzes",
    icon: ListChecks,
    img: quizzesImg,
    title: "Pre lecture quizzes, built by conversation",
    body: "Describe the topic or drop in your lecture notes, and get a well-formed quiz in minutes. Multiple choice, true/false, fill in the blank, short answer and open ended, mixed exactly how you want it.",
    tagBg: "#ede9fe",
    tagText: "#6d28d9",
    cardBg: "#faf5ff",
  },
  {
    id: "flashcards",
    label: "Flashcards",
    icon: Layers,
    img: flashcardsImg,
    title: "Pre reading that students actually finish",
    body: "Turn a chapter or slide deck into a flashcard set students can run through on their phone before the session, with no account to create.",
    tagBg: "#dbeafe",
    tagText: "#1d4ed8",
    cardBg: "#eff6ff",
  },
  {
    id: "matching",
    label: "Matching games",
    icon: Shuffle,
    img: matchingImg,
    title: "Terminology drilling without the busywork",
    body: "Pair terms with definitions, structures with functions, statutes with principles. Ideal for the vocabulary-heavy first weeks of a unit.",
    tagBg: "#fef3c7",
    tagText: "#b45309",
    cardBg: "#fffbeb",
  },
  {
    id: "editing",
    label: "Manual editing",
    icon: PencilRuler,
    img: editingImg,
    title: "Full control over every question",
    body: "Start from scratch or edit anything the assistant produced. Rewrite stems, reorder options, change the correct answer, add explanations. The editor is always yours.",
    tagBg: "#d1fae5",
    tagText: "#047857",
    cardBg: "#ecfdf5",
  },
  {
    id: "analytics",
    label: "Cohort analytics",
    icon: BarChart3,
    img: analyticsImg,
    title: "See the gap before you teach it",
    body: "Question-level results show which concepts your cohort missed, so the next lecture starts where the misunderstanding actually is.",
    tagBg: "#fce7f3",
    tagText: "#be185d",
    cardBg: "#fdf2f8",
  },
];

export const ProductTabs = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(products[0].id);
  const current = products.find((p) => p.id === active) ?? products[0];

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            One platform
          </span>
          <h2 className="font-display italic text-3xl md:text-5xl leading-[1.1] text-foreground mt-3">
            A connected experience for lecturers and students
          </h2>
        </div>

        {/* Large Colorful Tab Cards */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-12">
          {products.map((p) => {
            const isActive = active === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className="flex flex-col items-center gap-3 rounded-2xl p-5 md:p-6 transition-all duration-300"
                style={{
                  backgroundColor: isActive ? p.tagBg : "#f8f9fa",
                  transform: isActive ? "scale(1.05)" : "scale(1)",
                  boxShadow: isActive ? "0 8px 25px rgba(0,0,0,0.08)" : "none",
                }}
              >
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor: isActive ? p.tagText : "#e5e7eb",
                  }}
                >
                  <p.icon
                    className="w-6 h-6 md:w-7 md:h-7"
                    style={{ color: isActive ? "#ffffff" : "#9ca3af" }}
                    strokeWidth={2}
                  />
                </div>
                <span
                  className="text-[11px] md:text-[12px] font-bold uppercase tracking-[0.08em] transition-colors duration-300"
                  style={{ color: isActive ? p.tagText : "#9ca3af" }}
                >
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Card — two-column layout like Cadmus */}
        <div
          key={current.id}
          className="rounded-2xl overflow-hidden transition-colors duration-500"
          style={{ backgroundColor: current.cardBg }}
        >
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Side */}
            <div className="relative overflow-hidden flex items-center justify-center p-6 md:p-8">
              <img
                src={current.img}
                alt={current.title}
                loading="lazy"
                width={570}
                height={400}
                className="rounded-xl object-cover object-top animate-fade-in shadow-lg"
                style={{ width: "570px", height: "400px", maxWidth: "100%" }}
              />
            </div>

            {/* Content Side */}
            <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 animate-fade-in">
              {/* Tag */}
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider w-fit mb-6"
                style={{ backgroundColor: current.tagBg, color: current.tagText }}
              >
                <current.icon className="w-3 h-3" />
                {current.label}
              </span>

              <h3 className="font-display italic text-2xl md:text-3xl lg:text-4xl text-foreground mb-4 leading-[1.15]">
                {current.title}
              </h3>

              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">
                {current.body}
              </p>

              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-nav text-[13px] font-semibold transition-all duration-300 w-fit group"
                style={{
                  backgroundColor: current.tagText,
                  color: current.tagBg,
                }}
              >
                Try it free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>


      </div>
    </section>
  );
};

export default ProductTabs;
