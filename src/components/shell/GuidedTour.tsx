import { useEffect, useLayoutEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const steps = [
  {
    target: "demo-badge",
    eyebrow: "Start here",
    title: "A real place, invented data",
    body: "The streets and public destinations are real. Barrier locations, costs, conditions, and modeled demand are demonstration data.",
  },
  {
    target: "repair-list",
    eyebrow: "Individual view",
    title: "Inspect or try one repair",
    body: "Open any barrier to compare its local details with its network gain. Select it to add the repair to your plan.",
  },
  {
    target: "network-map",
    eyebrow: "Network view",
    title: "Watch complete routes change",
    body: "Red dashed segments are blocked. Selected repairs turn green only at the same location. Gray circles are modeled origin areas.",
  },
  {
    target: "network-metrics",
    eyebrow: "Technical note · BFS",
    title: "Every change reruns reachability",
    body: "For each origin, breadth-first search finds reachable destinations. Household demand weights the resulting connection count.",
  },
  {
    target: "opportunity",
    eyebrow: "Technical note · pair scan",
    title: "Find hidden dependencies",
    body: "The app tests every pair. Positive synergy means the pair adds more connections than the two repairs add separately.",
  },
] as const;

export function GuidedTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const currentStep = steps[step];
    if (!currentStep) return;
    const update = () => {
      const target = document.querySelector<HTMLElement>(`[data-tour="${currentStep.target}"]`);
      setRect(target?.getBoundingClientRect() ?? null);
      target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setStep((value) => Math.min(steps.length - 1, value + 1));
      if (event.key === "ArrowLeft") setStep((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const item = steps[step];
  if (!item) return null;
  const cardLeft = rect ? Math.min(window.innerWidth - 340, Math.max(16, rect.left)) : 24;
  const cardTop = rect ? Math.min(window.innerHeight - 250, rect.bottom + 16) : 96;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="BarrierBreak guided tour">
      {!rect && <div className="absolute inset-0 bg-foreground/45" />}
      {rect && <div className="tour-spotlight pointer-events-none absolute rounded-md ring-4 ring-repair ring-offset-4 ring-offset-background" style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }} />}
      <section className="absolute w-[min(320px,calc(100vw-32px))] rounded-md border bg-surface p-5 shadow-lg" style={{ left: cardLeft, top: cardTop }}>
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">{item.eyebrow}</p>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close tour"><X className="size-4" /></Button>
        </div>
        <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
        <div className="mt-5 flex items-center gap-2">
          <span className="tnum mr-auto text-xs text-muted-foreground">{step + 1} / {steps.length}</span>
          {step > 0 && <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}><ChevronLeft className="size-4" />Back</Button>}
          {step < steps.length - 1 ? (
            <Button size="sm" onClick={() => setStep(step + 1)}>Next<ChevronRight className="size-4" /></Button>
          ) : (
            <Button size="sm" asChild onClick={onClose}><Link to="/journey">Connect one trip<BookOpen className="size-4" /></Link></Button>
          )}
        </div>
      </section>
    </div>
  );
}
