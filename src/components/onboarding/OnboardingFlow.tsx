import { useState, useEffect } from "react";
import { OnboardingModal } from "./OnboardingModal";
import { OnboardingTooltip } from "./OnboardingTooltip";
import confetti from "canvas-confetti";
import { toast } from "sonner";

type OnboardingStep = 
  | 'welcome'
  | 'hero-input'
  | 'completed';

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingFlow = ({ onComplete, onSkip }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  useEffect(() => {
    if (currentStep === 'completed') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success("You're all set! 🎉");
      setTimeout(onComplete, 1000);
    }
  }, [currentStep, onComplete]);

  const handleStart = () => {
    // Set initial onboarding flags
    localStorage.setItem('is_onboarding', 'true');
    localStorage.setItem('onboarding_step', 'hero-input');
    setCurrentStep('hero-input');
  };

  const handleNext = () => {
    if (currentStep === 'hero-input') {
      // User is about to generate - they'll navigate to Builder
      localStorage.setItem('onboarding_step', 'builder-chat');
      localStorage.setItem('is_onboarding', 'true');
      // Dismiss the tooltip and complete this phase
      setCurrentStep('completed');
    }
  };

  const handleSkip = () => {
    // Clear localStorage flags
    localStorage.removeItem('is_onboarding');
    localStorage.removeItem('onboarding_step');
    toast.info("Tutorial skipped. You can replay it anytime from settings.");
    onSkip();
  };

  if (currentStep === 'welcome') {
    return <OnboardingModal open={true} onStart={handleStart} />;
  }

  if (currentStep === 'hero-input') {
    return (
      <OnboardingTooltip
        target=".onboarding-hero-input"
        position="bottom"
        step={0}
        totalSteps={4}
        title="Tell us what you want to create"
        description="Type anything! Try: 'Create a 5-question quiz about the solar system for 5th graders'. Then click Generate or press Enter to continue."
        onNext={handleNext}
        onSkip={handleSkip}
      />
    );
  }

  return null;
};
