import { useState } from "react";
import { FileText, File, Link as LinkIcon, Book, Download, Presentation } from "lucide-react";
import libraryImg from "@/assets/landing/collage-ask.jpg";
import studentImg from "@/assets/landing/collage-generate.jpg";
import shareImg from "@/assets/landing/collage-share.jpg";
import diagnoseImg from "@/assets/landing/collage-diagnose.jpg";

const materials = [
  {
    id: "pdf",
    label: "PDF",
    icon: FileText,
    iconColor: "text-rose-500",
    bgColor: "bg-rose-100/70",
    hoverBg: "hover:bg-rose-50",
    title: "Import from PDF instantly",
    description: "Upload any PDF lecture notes or readings. Quizabl instantly understands the context and generates highly relevant pre-lecture questions.",
    img: libraryImg,
  },
  {
    id: "word",
    label: "Word",
    icon: File,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100/70",
    hoverBg: "hover:bg-blue-50",
    title: "Process Word documents",
    description: "Drop your .docx files directly into the platform. We'll extract the key concepts and turn them into engaging student activities.",
    img: studentImg,
  },
  {
    id: "url",
    label: "Web URL",
    icon: LinkIcon,
    iconColor: "text-teal-500",
    bgColor: "bg-teal-100/70",
    hoverBg: "hover:bg-teal-50",
    title: "Scrape content from any URL",
    description: "Paste a link to an article, journal, or website. Quizabl will read the content and build a targeted pre-lecture check in seconds.",
    img: shareImg,
  },
  {
    id: "notion",
    label: "Notion",
    icon: Book,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-100/70",
    hoverBg: "hover:bg-purple-50",
    title: "Sync with your Notion workspace",
    description: "Connect your Notion pages seamlessly. Turn your structured lecture outlines into interactive student assessments without copy-pasting.",
    img: diagnoseImg,
  },
  {
    id: "canvas",
    label: "Canvas export",
    icon: Download,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-100/70",
    hoverBg: "hover:bg-orange-50",
    title: "Export directly to Canvas LMS",
    description: "Once your pre-lecture check is ready, push it directly to your Canvas course with one click. No manual setup required.",
    img: libraryImg,
  },
  {
    id: "powerpoint",
    label: "PowerPoint",
    icon: Presentation,
    iconColor: "text-pink-500",
    bgColor: "bg-pink-100/70",
    hoverBg: "hover:bg-pink-50",
    title: "Transform slide decks into quizzes",
    description: "Upload your PPTX lecture slides. We analyze the textual content and create assessments tailored to your exact presentation.",
    img: studentImg,
  },
];

export const CadmusMaterialSection = () => {
  const [activeId, setActiveId] = useState(materials[0].id);
  const activeMaterial = materials.find((m) => m.id === activeId) || materials[0];

  return (
    <section className="py-20 md:py-28 pb-16" style={{ backgroundColor: "hsl(var(--cadmus-cream))" }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 text-center mb-16">
        <h2 className="font-display text-4xl md:text-5xl text-foreground mb-12">
          Works with your material
        </h2>

        {/* The Tabs */}
        <div className="flex flex-wrap justify-center items-center gap-y-4">
          {materials.map((material, idx) => {
            const isActive = activeId === material.id;
            return (
              <div key={material.id} className="flex items-center">
                <button
                  onClick={() => setActiveId(material.id)}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-md transition-all duration-300 ${
                    isActive 
                      ? `${material.bgColor} shadow-sm scale-105` 
                      : `bg-transparent ${material.hoverBg}`
                  }`}
                >
                  <material.icon className={`w-5 h-5 ${material.iconColor}`} strokeWidth={2.5} />
                  <span className={`text-[13px] font-bold uppercase tracking-[0.1em] ${
                    isActive ? "text-slate-900" : "text-slate-600"
                  }`}>
                    {material.label}
                  </span>
                </button>

                {/* Vertical Divider */}
                {idx < materials.length - 1 && (
                  <div className="hidden md:block w-px h-8 bg-black/10 mx-3"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* The Overlap Image and Card (Cadmus Style) */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 mt-12">
        <div className="relative z-20 w-full max-w-[1040px] mx-auto animate-in fade-in duration-500" key={activeMaterial.id}>
          
          {/* Main Image Container */}
          <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden shadow-lg">
            <img 
              src={activeMaterial.img} 
              alt={activeMaterial.title} 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Floating Card */}
          <div className="
            absolute z-30
            bottom-[-2rem] left-4 right-4 
            lg:bottom-[-5rem] lg:left-[-4rem] lg:right-auto 
            bg-white rounded-xl p-8 md:p-12 
            shadow-[0_20px_50px_rgba(0,0,0,0.08)]
            w-[90%] lg:w-[480px]
          ">
            <span className="block text-xs font-bold uppercase tracking-[0.15em] mb-3 text-primary">
              {activeMaterial.label} Integration
            </span>
            <h3 className="font-display text-3xl md:text-4xl leading-[1.15] text-foreground mb-4">
              {activeMaterial.title}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-8">
              {activeMaterial.description}
            </p>
            <button className="rounded bg-[#0f172a] text-white px-5 py-2.5 font-nav text-sm font-semibold hover:bg-[#1e293b] transition-colors border border-[#0f172a]">
              Learn more
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CadmusMaterialSection;
