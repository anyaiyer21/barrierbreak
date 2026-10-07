import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Info, MapPin, MoveRight, PlayCircle, Waypoints } from "lucide-react";

import { cn } from "@/lib/utils";
import { cities, scenario, type CityId } from "@/lib/scenarioEngine";
import { useCity } from "@/lib/city";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GuidedTour } from "@/components/shell/GuidedTour";

const tabs = [
  { to: "/", label: "Planner" },
  { to: "/journey", label: "Connect One Trip" },
  { to: "/technical", label: "How it works" },
] as const;

export function DemoDataBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-barrier/30 bg-barrier/8 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-barrier",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-barrier" aria-hidden />
      Demo data — not municipal analysis
    </span>
  );
}

function EvidenceDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Info className="size-4" aria-hidden />
          Real vs. invented
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Real vs. invented</SheetTitle>
          <SheetDescription>
            What is real in this prototype, and what is illustrative.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-10 text-sm leading-relaxed">
          <section>
            <h3 className="mb-2 font-semibold">Real</h3>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Place names in and around {scenario.city} (library, commons, parks, schools).</li>
              <li>The planning question: which repair combinations complete accessible journeys.</li>
            </ul>
          </section>
          <section>
            <h3 className="mb-2 font-semibold">Illustrative</h3>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Every barrier id, location, condition rating and planning cost.</li>
              <li>Household counts and modeled accessible connection counts.</li>
              <li>Modeled accessible coverage percentages.</li>
              <li>Both plans on the comparison page.</li>
            </ul>
          </section>
          <section>
            <h3 className="mb-2 font-semibold">Not yet implemented</h3>
            <p className="text-muted-foreground">
              This prototype reads hand-authored demo data. The BarrierBreak
              optimization model, the municipal pedestrian-network graph and the WA-08 data register
              are not part of this build. Results shown here are a demonstration of product
              interaction, not analysis.
            </p>
          </section>
          <section>
            <h3 className="mb-2 font-semibold">A note for city staff</h3>
            <p className="text-muted-foreground">
              BarrierBreak does not claim to know what a city should have built. Real programs weigh
              engineering feasibility, grant conditions, utilities, construction coordination and
              legal obligations that this prototype does not represent.
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CityPicker() {
  const { city, setCity } = useCity();
  return (
    <div className="flex items-center gap-2">
      <Select value={city} onValueChange={(v) => setCity(v as CityId)}>
        <SelectTrigger aria-label="Choose a city" className="h-8 gap-1.5 text-[13px] font-medium">
          <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {cities.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="hidden whitespace-nowrap text-[13px] text-muted-foreground 2xl:inline">illustrative demo data</span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    if (window.location.pathname !== "/") return;
    if (window.localStorage.getItem("bb-tour-seen") !== "true") setTourOpen(true);
  }, []);
  const closeTour = () => {
    window.localStorage.setItem("bb-tour-seen", "true");
    setTourOpen(false);
  };
  return (
    <div className="flex h-dvh min-h-0 flex-col bg-background text-foreground">
      <header className="z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-surface px-4">
        <Link to="/" className="flex items-center gap-2 rounded-sm">
          <Waypoints className="size-5 text-repair" aria-hidden />
          <span className="text-[15px] font-semibold tracking-tight">BarrierBreak</span>
        </Link>
        <CityPicker />

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-0.5 lg:flex">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
              activeOptions={{ exact: t.to === "/" }}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <span data-tour="demo-badge"><DemoDataBadge className="hidden xl:inline-flex" /></span>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setTourOpen(true)}><PlayCircle className="size-4" />Tour</Button>
          <EvidenceDrawer />
        </div>
      </header>

      <nav
        aria-label="Primary mobile"
        className="flex shrink-0 gap-1 overflow-x-auto border-b bg-surface px-3 py-2 lg:hidden"
      >
        {tabs.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground"
            activeProps={{ className: "bg-muted text-foreground" }}
            activeOptions={{ exact: t.to === "/" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <main className="min-h-0 flex-1">{children}</main>
      <GuidedTour open={tourOpen} onClose={closeTour} />
    </div>
  );
}

export function InlineLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 font-medium text-accent-foreground underline underline-offset-4"
    >
      {children}
      <MoveRight className="size-3.5" aria-hidden />
    </Link>
  );
}

export default AppShell;
