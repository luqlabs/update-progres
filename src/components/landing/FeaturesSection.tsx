import {
  MessageSquare,
  Users,
  Target,
  Trophy,
  Clock,
  BarChart3,
  Palette,
  Upload,
  ListChecks,
  Pencil,
  Layers,
} from "lucide-react";
import { Section, SectionHeading } from "./Section";

const features = [
  {
    icon: Target,
    title: "Diagnose the gap before you teach",
    description:
      "Run a formative or pre-lecture check before lecture and see per-topic results, so you teach to the actual gap instead of your guess.",
  },
  {
    icon: MessageSquare,
    title: "Draft it by chatting with AI",
    description:
      "Describe what you want to assess in plain language — Quizabl writes the first draft and refines it as you keep chatting.",
  },
  {
    icon: Pencil,
    title: "Full manual editing control",
    description:
      "Every question stays editable. Rewrite stems, fix options, change the correct answer, reorder or delete — no AI required.",
  },
  {
    icon: ListChecks,
    title: "Multiple question types",
    description:
      "Multiple choice, true/false, short answer, fill-in-the-blank, polls and slide cards — mix them freely in one activity.",
  },
  {
    icon: Layers,
    title: "Quizzes, flashcards & matching games",
    description:
      "Turn the same source material into a quiz, a flashcard deck, or a matching game — each with its own dedicated editor.",
  },
  {
    icon: Upload,
    title: "Built from your own material",
    description:
      "Upload lecture notes, PDFs or links — pick the exact pages — and Quizabl generates questions grounded in your content.",
  },
  {
    icon: BarChart3,
    title: "Cohort analytics in real time",
    description:
      "Live tracking with per-question and per-student breakdowns, so you can see who needs help while the session is still running.",
  },
  {
    icon: Users,
    title: "No student accounts",
    description:
      "Share one link or QR code. Students join instantly — no sign-ups, no downloads, no lost class time.",
  },
  {
    icon: Clock,
    title: "Hints, timers & difficulty",
    description:
      "Add per-question hints, set timers, and tune difficulty to keep the check challenging without discouraging students.",
  },
  {
    icon: Trophy,
    title: "Optional leaderboards",
    description:
      "Turn on live rankings with accuracy and time tracking when you want a bit of friendly competition — or leave it off.",
  },
  {
    icon: Palette,
    title: "Six professional themes",
    description:
      "Indigo, Emerald, Slate, Blue, Amber and Sky — switch theme from chat or straight in the preview panel.",
  },
];

export const FeaturesSection = () => {
  return (
    <Section id="features" tone="transparent">
      <SectionHeading
        eyebrow="Features"
        title="Everything you need to find — and close — the gap"
        description="From pre-lecture activity to live cohort insights — on one simple subscription, with no student logins."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-14 border-t border-border">
        {features.map((feature) => (
          <div key={feature.title} className="flex gap-4 py-6 border-b border-border">
            <feature.icon className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "hsl(var(--badge-bg))" }} />
            <div>
              <h3 className="font-semibold text-foreground mb-1.5">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};
