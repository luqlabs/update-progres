import { useState } from "react";
import tabEditingImg from "@/assets/landing/tab_editing_method.jpg";
import tabOutputImg from "@/assets/landing/tab_output_variety.jpg";
import tabStudentImg from "@/assets/landing/tab_student_access.jpg";
import tabSourceImg from "@/assets/landing/tab_source_material.jpg";

const tabs = [
  {
    id: "editing",
    label: "EDITING METHOD",
    title: "Conversational drafting + full manual control",
    description: "Where QuestionWell limits you to manual forms and Kahoot to rigid clicking, Quizabl lets you describe what you want in plain chat, then gives you a powerful editor to tweak every single detail.",
    image: tabEditingImg
  },
  {
    id: "output",
    label: "OUTPUT VARIETY",
    title: "Quizzes, flashcards, and matching games",
    description: "Don't settle for just quizzes. While other platforms limit your formats or only act as export tools, Quizabl instantly turns one source into multiple engaging activity types.",
    image: tabOutputImg
  },
  {
    id: "access",
    label: "STUDENT ACCESS",
    title: "One link. No logins. No lost class time.",
    description: "Unlike Kahoot which often requires apps and accounts, or QuestionWell which requires an LMS export, Quizabl works instantly. Students click a link and join immediately.",
    image: tabStudentImg
  },
  {
    id: "source",
    label: "SOURCE MATERIAL",
    title: "Upload PDFs, Word docs, and web links",
    description: "Break free from limited text-pasting. Quizabl securely processes your actual lecture slides and reading materials directly, maintaining the specific context of your course.",
    image: tabSourceImg
  }
];

export const ComparisonSection = () => {
  const [active, setActive] = useState(tabs[0].id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <section className="py-20 md:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600/80 mb-4 block">
            An honest comparison
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-slate-900 mb-6 leading-tight">
            How we compare to the tools you know.
          </h2>
          <p className="text-lg text-slate-600">
            A smarter, faster workflow that doesn't sacrifice control or lock students behind accounts.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-16">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-[0.1em] transition-all duration-300 ${
                active === tab.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105"
                  : "bg-white/50 text-slate-500 hover:bg-white hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div className="order-2 lg:order-1 relative rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-700 aspect-[4/3] group bg-white p-4">
             <div className="w-full h-full rounded-xl overflow-hidden relative">
               <img
                  key={current.id + "-img"}
                  src={current.image}
                  alt={current.title}
                  className="w-full h-full object-cover animate-fade-in transition-transform duration-700 group-hover:scale-105"
               />
             </div>
          </div>

          {/* Text */}
          <div className="order-1 lg:order-2 flex flex-col justify-center animate-fade-in" key={current.id + "-text"}>
            <div className="w-12 h-1 bg-blue-600 mb-8 rounded-full opacity-50"></div>
            <h3 className="font-display text-3xl md:text-4xl text-slate-900 mb-6 leading-[1.2]">
              {current.title}
            </h3>
            <p className="text-slate-600 text-lg leading-relaxed">
              {current.description}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ComparisonSection;