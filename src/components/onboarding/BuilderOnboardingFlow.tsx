import { useState, useEffect } from "react";
import { OnboardingTooltip } from "./OnboardingTooltip";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type BuilderStep = 
  | 'builder-chat'
  | 'builder-preview'
  | 'edit-tab'
  | 'settings-tab'
  | 'assign-button'
  | 'analytics-button'
  | null;

interface BuilderOnboardingFlowProps {
  currentStep: BuilderStep;
  onComplete: () => void;
  onSkip: () => void;
  appId: string | null;
  onStepChange?: (step: BuilderStep) => void;
}

export const BuilderOnboardingFlow = ({ 
  currentStep, 
  onComplete, 
  onSkip, 
  appId,
  onStepChange
}: BuilderOnboardingFlowProps) => {
  const [step, setStep] = useState<BuilderStep>(currentStep);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    setStep(currentStep);
  }, [currentStep]);

  const updateStep = (newStep: BuilderStep) => {
    setStep(newStep);
    if (newStep) {
      localStorage.setItem('onboarding_step', newStep);
      onStepChange?.(newStep);
    }
  };

  const handleNext = async () => {
    if (step === 'builder-chat') {
      if (isMobile) {
        updateStep('edit-tab');
      } else {
        updateStep('builder-preview');
      }
    } else if (step === 'builder-preview') {
      updateStep('edit-tab');
    } else if (step === 'edit-tab') {
      updateStep('settings-tab');
    } else if (step === 'settings-tab') {
      updateStep('assign-button');
    } else if (step === 'assign-button') {
      updateStep('analytics-button');
    } else if (step === 'analytics-button') {
      await handleComplete();
    }
  };

  const handleComplete = async () => {
    // Update database
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({ 
          has_completed_onboarding: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_step: 'completed'
        })
        .eq('id', session.user.id);
    }

    // Clear localStorage
    localStorage.removeItem('is_onboarding');
    localStorage.removeItem('onboarding_step');

    // Celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    toast.success("You're all set! 🎉 You're now a Quizabl pro!");
    
    setTimeout(onComplete, 1000);
  };

  const handleSkipLocal = async () => {
    // Clear localStorage
    localStorage.removeItem('is_onboarding');
    localStorage.removeItem('onboarding_step');
    
    // Update database
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({ 
          has_completed_onboarding: true,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_step: 'completed'
        })
        .eq('id', session.user.id);
    }

    toast.info("Tutorial skipped. Replay anytime from Settings.");
    onSkip();
  };

  const totalSteps = isMobile ? 5 : 6;

  if (step === 'builder-chat') {
    return (
      <OnboardingTooltip
        target=".builder-chat-interface"
        position="right"
        step={1}
        totalSteps={totalSteps}
        title="Your AI Assistant"
        description="Chat naturally to refine your app. Try: 'Make question 3 easier' or 'Add a 30-second timer'"
        onNext={handleNext}
        onSkip={handleSkipLocal}
      />
    );
  }

  if (step === 'builder-preview' && !isMobile) {
    return (
      <OnboardingTooltip
        target=".builder-preview-panel"
        position="left"
        step={2}
        totalSteps={totalSteps}
        title="See it live"
        description="This is exactly what your students will see. Try it out yourself!"
        onNext={handleNext}
        onSkip={handleSkipLocal}
      />
    );
  }

  if (step === 'edit-tab') {
    return (
      <OnboardingTooltip
        target=".builder-edit-tab"
        position="bottom"
        step={isMobile ? 2 : 3}
        totalSteps={totalSteps}
        title="Customize Your Questions"
        description="Manually add, delete, duplicate, or reorder questions. Perfect for fine-tuning AI-generated content."
        onNext={handleNext}
        onSkip={handleSkipLocal}
      />
    );
  }

  if (step === 'settings-tab') {
    return (
      <OnboardingTooltip
        target=".builder-settings-tab"
        position="bottom"
        step={isMobile ? 3 : 4}
        totalSteps={totalSteps}
        title="Quiz Behavior Settings"
        description="Control how your quiz works - timer settings, answer visibility, audio, and more."
        onNext={handleNext}
        onSkip={handleSkipLocal}
      />
    );
  }

  if (step === 'assign-button') {
    return (
      <OnboardingTooltip
        target=".builder-assign-button"
        position="left"
        step={isMobile ? 4 : 5}
        totalSteps={totalSteps}
        title="Share with Students"
        description="Generate a QR code or link to share. Students don't need accounts!"
        onNext={handleNext}
        onSkip={handleSkipLocal}
      />
    );
  }

  if (step === 'analytics-button') {
    return (
      <OnboardingTooltip
        target=".builder-analytics-button"
        position="left"
        step={isMobile ? 5 : 6}
        totalSteps={totalSteps}
        title="Track Performance"
        description="See detailed analytics: question performance, student scores, and common mistakes."
        onNext={handleNext}
        onSkip={handleSkipLocal}
      />
    );
  }

  return null;
};
