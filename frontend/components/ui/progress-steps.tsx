import type { LucideIcon } from "lucide-react";
import { Brain, Camera, Palette, Sparkles, Wand2 } from "lucide-react";

export interface ProgressStep {
  label: string;
  icon: LucideIcon;
}

const DEFAULT_STEPS: ProgressStep[] = [
  { label: "Analyzing photo", icon: Camera },
  { label: "Detecting features", icon: Brain },
  { label: "Generating palette", icon: Palette },
  { label: "Building outfit", icon: Wand2 },
  { label: "Finalizing", icon: Sparkles },
];

export interface ProgressStepsProps {
  currentStep: number;
  steps?: ProgressStep[];
}

export function ProgressSteps({ currentStep, steps = DEFAULT_STEPS }: ProgressStepsProps) {
  return (
    <div className="progress-steps">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const status =
          index < currentStep ? "done" : index === currentStep ? "active" : "pending";

        return (
          <div key={step.label} className={`progress-step progress-step--${status}`}>
            <div className="progress-step__icon">
              <Icon size={16} />
            </div>
            <span className="progress-step__label">{step.label}</span>
            {index < steps.length - 1 && <div className="progress-step__line" />}
          </div>
        );
      })}
    </div>
  );
}
