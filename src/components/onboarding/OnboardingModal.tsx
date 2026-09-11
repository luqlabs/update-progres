import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onStart: () => void;
}

export const OnboardingModal = ({ open, onStart }: OnboardingModalProps) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary rounded-md flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <DialogTitle className="text-center text-2xl">Welcome to Quizabl! 🎉</DialogTitle>
          <DialogDescription className="text-center text-base">
            Let's create your first quiz, flashcard set, or matching game in 30 seconds. Ready?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button onClick={onStart} size="lg" className="w-full">
            Let's Go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
