import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DemoDataBadge } from "@/components/shell/AppShell";
import ComplementarityDiagram from "@/components/inspector/ComplementarityDiagram";
import { getBundle } from "@/lib/scenarioEngine";

/** Three-screen opener for city meetings. Shown with ?demo=true. */
export function GuidedIntro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const bundle = getBundle("UB-01");

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Introduction"
    >
      <div className="w-full max-w-2xl rounded-xl border bg-surface p-8 shadow-lg">
        {step === 0 ? (
          <>
            <DemoDataBadge />
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight">
              Accessibility is a network problem.
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Fixing one barrier may accomplish nothing if another still blocks the journey.
              BarrierBreak looks at combinations of repairs and the trips they complete together.
            </p>
            <div className="mt-7 flex gap-2">
              <Button onClick={() => setStep(1)}>See an example</Button>
              <Button variant="ghost" onClick={onDone}>
                Skip to the planner
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold tracking-tight">
              Two repairs. Only useful together.
            </h2>
            <p className="mt-2 text-[14px] text-muted-foreground">
              Switch between the three states. Neither crossing completes a trip on its own.
            </p>
            <div className="mt-5">{bundle && <ComplementarityDiagram bundle={bundle} />}</div>
            <div className="mt-7 flex gap-2">
              <Button onClick={onDone}>Explore the planner</Button>
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GuidedIntro;
