import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, X } from "lucide-react";
import { StepIndicator } from "./StepIndicator";
import { useEffect, useState } from "react";

interface OnboardingTooltipProps {
  target: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  onNext: () => void;
  onSkip: () => void;
  highlightPulse?: boolean;
}

export const OnboardingTooltip = ({
  target,
  position = 'bottom',
  step,
  totalSteps,
  title,
  description,
  onNext,
  onSkip,
  highlightPulse = true,
}: OnboardingTooltipProps) => {
  const [isTargetReady, setIsTargetReady] = useState(false);

  // Wait for target element to be fully rendered with valid dimensions
  useEffect(() => {
    setIsTargetReady(false); // Reset when target changes
    let retries = 0;
    const maxRetries = 20;
    
    const checkTarget = () => {
      const targetElement = document.querySelector(target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setIsTargetReady(true);
          return;
        }
      }
      
      retries++;
      if (retries < maxRetries) {
        setTimeout(checkTarget, 100);
      } else {
        // Give up and show tooltip anyway
        setIsTargetReady(true);
      }
    };
    
    checkTarget();
  }, [target]);

  useEffect(() => {
    const targetElement = document.querySelector(target);
    if (targetElement && highlightPulse) {
      targetElement.classList.add('onboarding-spotlight', 'onboarding-pulse');
      return () => {
        targetElement.classList.remove('onboarding-spotlight', 'onboarding-pulse');
      };
    }
  }, [target, highlightPulse]);

  useEffect(() => {
    const targetElement = document.querySelector(target);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [target]);

  const getPositionStyles = () => {
    const targetElement = document.querySelector(target);
    if (!targetElement) return {};

    const rect = targetElement.getBoundingClientRect();
    const isMobile = window.innerWidth < 768 && rect.width > 0 && rect.height > 0;

    // Fallback: If target has invalid dimensions (hidden/collapsed), center on screen
    if (rect.width === 0 || rect.height === 0) {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '360px',
        maxWidth: '90vw',
      };
    }

    if (isMobile) {
      return {
        position: 'fixed' as const,
        bottom: '20px',
        left: '20px',
        right: '20px',
      };
    }

    switch (position) {
      case 'bottom':
        return {
          position: 'fixed' as const,
          top: `${rect.bottom + 20}px`,
          left: `${rect.left}px`,
        };
      case 'top':
        return {
          position: 'fixed' as const,
          bottom: `${window.innerHeight - rect.top + 20}px`,
          left: `${rect.left}px`,
        };
      case 'right':
        return {
          position: 'fixed' as const,
          top: `${rect.top}px`,
          left: `${rect.right + 20}px`,
        };
      case 'left':
        return {
          position: 'fixed' as const,
          top: `${rect.top}px`,
          right: `${window.innerWidth - rect.left + 20}px`,
        };
      default:
        return {};
    }
  };

  if (!isTargetReady) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[9999]" onClick={onSkip} />
      <Card className="w-full max-w-sm p-6 shadow-none fixed z-[10001] pointer-events-auto bg-card" style={getPositionStyles()}>
        <StepIndicator current={step} total={totalSteps} />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 text-sm">{description}</p>
        <div className="flex gap-3 pointer-events-auto">
          <Button onClick={onNext} className="flex-1">
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onSkip}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </>
  );
};
