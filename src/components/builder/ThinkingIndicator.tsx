import { useEffect, useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";

interface ThinkingIndicatorProps {
  mode: "chat" | "generating";
}

const CHAT_STEPS = [
  "Thinking",
  "Reading your message",
  "Considering options",
  "Drafting a reply",
];

const GENERATING_STEPS = [
  "Preparing",
  "Structuring the activity",
  "Writing questions",
  "Polishing details",
  "Almost done",
];

export function ThinkingIndicator({ mode }: ThinkingIndicatorProps) {
  const steps = mode === "generating" ? GENERATING_STEPS : CHAT_STEPS;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    const id = setInterval(() => {
      setIndex((i) => (i < steps.length - 1 ? i + 1 : i));
    }, 1800);
    return () => clearInterval(id);
  }, [mode, steps.length]);

  const Icon = mode === "generating" ? Wand2 : Sparkles;

  return (
    <div className="flex items-center gap-2 py-2">
      <Icon className="w-4 h-4 text-primary animate-pulse" />
      <span
        key={index}
        className="shimmer-text text-sm font-medium animate-fade-in"
      >
        {steps[index]}
      </span>
    </div>
  );
}
