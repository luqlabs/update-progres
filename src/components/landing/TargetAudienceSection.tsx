import { GraduationCap, BookOpen, Users, FlaskConical, Scale, HeartPulse } from "lucide-react";
import { Section, SectionHeading } from "./Section";

const audiences = [
  {
    icon: GraduationCap,
    title: "Professors",
    description: "Open the term with a 5-minute activity. Walk into the first lecture knowing exactly which prerequisites your cohort is missing.",
  },
  {
    icon: BookOpen,
    title: "Lecturers",
    description: "Run a formative check before each topic, so contact hours go to the concepts students actually struggle with.",
  },
  {
    icon: Users,
    title: "Assistant Lecturers & TAs",
    description: "Prepare tutorials around real evidence. See which students need a nudge before they fall quietly behind.",
  },
  {
    icon: FlaskConical,
    title: "STEM Lecturers",
    description: "Catch shaky prerequisites — algebra, units, notation — before they compound through the whole module.",
  },
  {
    icon: Scale,
    title: "Law & Business Lecturers",
    description: "Test case comprehension and terminology from your own readings, not from a generic question bank.",
  },
  {
    icon: HeartPulse,
    title: "Health Sciences Lecturers",
    description: "Check clinical reasoning and recall ahead of practicals, so lab and placement time is spent on the hard parts.",
  },
];

export const TargetAudienceSection = ({ className = "" }: { className?: string }) => {
  return (
    <Section id="audience" className={className} tone="transparent">
      <SectionHeading
        eyebrow="Who it's for"
        title="Built for lecturers who take student success personally"
        description="For professors, lecturers and assistant lecturers who would rather find the gap before the exam than explain it afterwards."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
        {audiences.map((audience, index) => (
          <div
            key={audience.title}
            className="animate-fade-in"
            style={{ animationDelay: `${0.05 * index}s` }}
          >
            <audience.icon className="w-5 h-5 mb-4" style={{ color: "hsl(var(--badge-bg))" }} />
            <h3 className="font-semibold text-foreground mb-2">{audience.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{audience.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};
