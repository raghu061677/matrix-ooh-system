
"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Step {
  label: string
  description?: string
  icon?: React.ElementType
}

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  initialStep?: number
  steps: Step[]
}

interface StepperContextValue extends StepperProps {
  activeStep: number
  isLastStep: boolean
  isFirstStep: boolean
  goToNextStep: () => void
  goToPreviousStep: () => void
  resetSteps: () => void
  setStep: (step: number) => void
}

const StepperContext = React.createContext<StepperContextValue>({
  activeStep: 0,
  isLastStep: false,
  isFirstStep: false,
  goToNextStep: () => {},
  goToPreviousStep: () => {},
  resetSteps: () => {},
  setStep: () => {},
  steps: [],
})

function useStepper() {
  const context = React.useContext(StepperContext)
  if (context === undefined) {
    throw new Error("useStepper must be used within a StepperProvider")
  }
  return context
}

function StepperProvider({ children, ...props }: { children: React.ReactNode } & StepperProps) {
  const [activeStep, setActiveStep] = React.useState(props.initialStep || 0)
  
  const isLastStep = activeStep === props.steps.length - 1
  const isFirstStep = activeStep === 0

  const goToNextStep = () => {
    if (!isLastStep) {
      setActiveStep((prev) => prev + 1)
    }
  }

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      setActiveStep((prev) => prev - 1)
    }
  }
  
  const resetSteps = () => {
      setActiveStep(props.initialStep || 0)
  }

  const setStep = (step: number) => {
      if(step >= 0 && step < props.steps.length) {
          setActiveStep(step)
      }
  }

  return (
    <StepperContext.Provider value={{ ...props, activeStep, isLastStep, isFirstStep, goToNextStep, goToPreviousStep, resetSteps, setStep }}>
      {children}
    </StepperContext.Provider>
  )
}


const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <StepperProvider {...props}>
        <div
          ref={ref}
          className={cn(
            "flex w-full items-center justify-between gap-4",
            className
          )}
        >
          <StepperContent>{children}</StepperContent>
        </div>
      </StepperProvider>
    )
  }
)
Stepper.displayName = "Stepper"

const StepperContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    const { steps, activeStep } = useStepper()
    return (
        <>
        {steps.map((step, index) => {
            const isActive = index === activeStep
            const isCompleted = index < activeStep
            const Icon = step.icon ? step.icon : Check

            return (
                <React.Fragment key={step.label}>
                    <div className="flex items-center gap-2">
                        <div
                            className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border-2",
                            isActive && "border-primary",
                            isCompleted && "border-primary bg-primary text-primary-foreground"
                            )}
                        >
                            {isCompleted ? <Icon className="h-5 w-5" /> : index + 1}
                        </div>
                        <div>
                            <p className={cn("font-medium", isActive && "text-primary")}>{step.label}</p>
                            {step.description && <p className="text-sm text-muted-foreground">{step.description}</p>}
                        </div>
                    </div>
                    {index < steps.length - 1 && <div className="h-px flex-1 bg-border" />}
                </React.Fragment>
            )
        })}
        </>
    )
});
StepperContent.displayName = "StepperContent"

const StepperActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    const { isLastStep, isFirstStep, goToNextStep, goToPreviousStep } = useStepper()
    return (
        <div ref={ref} className={cn("flex justify-end gap-2", props.className)} {...props}>
        <Button disabled={isFirstStep} onClick={goToPreviousStep}>Back</Button>
        <Button disabled={isLastStep} onClick={goToNextStep}>Next</Button>
        </div>
    )
})
StepperActions.displayName = "StepperActions"

export { Stepper, useStepper }
