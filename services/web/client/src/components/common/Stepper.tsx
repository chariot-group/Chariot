import React from "react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex flex-row justify-evenly items-center">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;

        return (
          <React.Fragment key={index}>
            <div className="relative flex flex-col justify-center">
              <div
                className={cn(
                  "z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium transition-all",
                  isCompleted
                    ? "bg-primary text-white border-primary"
                    : isActive
                      ? "border-primary text-primary"
                      : "border-muted-foreground text-muted-foreground",
                )}>
                {stepNumber}
              </div>
              <div className="absolute top-full mt-2 w-max text-xs text-center left-1/2 -translate-x-1/2">{step}</div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 w-full h-1 z-0 rounded-lg",
                  isCompleted || (isCompleted && stepNumber + 1 === currentStep + 1)
                    ? "bg-primary"
                    : "bg-muted-foreground",
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
