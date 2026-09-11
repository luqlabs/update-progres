import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  PencilRuler,
  ListChecks,
  Layers,
  Shuffle,
  ArrowLeft,
} from "lucide-react";

export type ManualAppType = "quiz" | "flashcards" | "matching";

interface CreateActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCreating?: boolean;
  onChooseAI: () => void;
  onChooseManual: (type: ManualAppType) => void;
}

const FORMATS: {
  type: ManualAppType;
  label: string;
  description: string;
  icon: typeof ListChecks;
}[] = [
  {
    type: "quiz",
    label: "Quiz",
    description:
      "Multiple choice, true/false, short answer, polls and instructional slides.",
    icon: ListChecks,
  },
  {
    type: "flashcards",
    label: "Flashcards",
    description: "Front-and-back cards for recall practice before a lecture.",
    icon: Layers,
  },
  {
    type: "matching",
    label: "Matching game",
    description: "Pair terms with definitions, formulas or case examples.",
    icon: Shuffle,
  },
];

export const CreateActivityDialog = ({
  open,
  onOpenChange,
  isCreating = false,
  onChooseAI,
  onChooseManual,
}: CreateActivityDialogProps) => {
  const [step, setStep] = useState<"mode" | "format">("mode");

  useEffect(() => {
    if (open) setStep("mode");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "mode" ? "Create a new activity" : "Choose a format"}
          </DialogTitle>
          <DialogDescription>
            {step === "mode"
              ? "Start a conversation with the assistant, or build it yourself question by question."
              : "You'll go straight to the editor. No credits used."}
          </DialogDescription>
        </DialogHeader>

        {step === "mode" ? (
          <div className="grid gap-3">
            <button
              type="button"
              disabled={isCreating}
              onClick={onChooseAI}
              className="flex items-start gap-3 rounded-md border p-4 text-left transition-colors hover:bg-muted disabled:opacity-60"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  Describe it to the assistant
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Paste a syllabus, a document or a topic and let the assistant
                  draft the questions. Uses one AI credit.
                </span>
              </span>
            </button>

            <button
              type="button"
              disabled={isCreating}
              onClick={() => setStep("format")}
              className="flex items-start gap-3 rounded-md border p-4 text-left transition-colors hover:bg-muted disabled:opacity-60"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <PencilRuler className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  Start from scratch
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Write every question yourself in the editor. No AI, no credits
                  used.
                </span>
              </span>
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {FORMATS.map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.type}
                  type="button"
                  disabled={isCreating}
                  onClick={() => onChooseManual(format.type)}
                  className="flex items-start gap-3 rounded-md border p-4 text-left transition-colors hover:bg-muted disabled:opacity-60"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {format.label}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {format.description}
                    </span>
                  </span>
                </button>
              );
            })}

            <Button
              variant="ghost"
              size="sm"
              className="justify-start px-2"
              onClick={() => setStep("mode")}
              disabled={isCreating}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
