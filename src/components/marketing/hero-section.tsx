import Link from "next/link";
import { ArrowRight, MapPinned, Navigation, RadioTower } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const heroSignals = [
  {
    label: "Active city",
    value: "Pitesti",
  },
  {
    label: "Dispatch precision",
    value: "< 90 sec",
  },
  {
    label: "Coverage mode",
    value: "Controlled",
  },
] as const;

const routeNodes = [
  {
    label: "Hub",
    detail: "Central launch",
    icon: RadioTower,
  },
  {
    label: "Route",
    detail: "Live corridor",
    icon: Navigation,
  },
  {
    label: "Drop-off",
    detail: "Verified handoff",
    icon: MapPinned,
  },
] as const;

export function HeroSection() {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] lg:items-stretch">
      <div className="flex flex-col justify-between rounded-[var(--ui-radius-panel)] border border-border/80 bg-card px-6 py-7 shadow-[var(--elevation-panel)] sm:px-8 sm:py-8 md:px-10 md:py-10">
        <div className="space-y-8">
          <div className="flex flex-col gap-5">
            <BrandMark />
            <Badge variant="outline" className="w-fit">
              Urban Drone Logistics
            </Badge>
          </div>

          <div className="space-y-5">
            <h1 className="max-w-4xl font-heading text-4xl leading-[1.02] tracking-normal text-foreground sm:text-5xl lg:text-[4.35rem]">
              Live drone delivery for Pitesti.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Create deliveries, track active orders and see verified coverage
              in one clear operational surface. SkySend is active now in
              Pitesti and available inside the current service zone.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6">
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/client/create-delivery">
                Create delivery
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">Track mission</Link>
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {heroSignals.map((signal) => (
              <div
                key={signal.label}
                className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 px-4 py-4"
              >
                <p className="text-sm text-muted-foreground">{signal.label}</p>
                <p className="mt-2 font-heading text-2xl tracking-tight">
                  {signal.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card className="rounded-[var(--ui-radius-panel)] bg-secondary/70 shadow-[var(--elevation-card)]">
        <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="type-caption">Operations Preview</p>
              <h2 className="font-heading text-2xl tracking-tight text-foreground">
                Controlled city routing.
              </h2>
            </div>
            <StatusBadge label="Service active" tone="info" />
          </div>

          <div className="rounded-[calc(var(--radius)+0.625rem)] border border-border/80 bg-card px-4 py-4 shadow-[var(--elevation-soft)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Mission lane</p>
                <p className="mt-1 font-heading text-xl tracking-tight">
                  Hub to verified drop-off
                </p>
              </div>
              <StatusBadge label="Live now" tone="success" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {routeNodes.map((node, index) => {
                const Icon = node.icon;

                return (
                  <div
                    key={node.label}
                    className="relative rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/45 px-4 py-4"
                  >
                    {index < routeNodes.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 right-[-0.7rem] hidden h-px w-4 bg-border lg:block"
                      />
                    ) : null}
                    <span className="flex size-10 items-center justify-center rounded-2xl border border-border/80 bg-card text-foreground shadow-[var(--elevation-soft)]">
                      <Icon className="size-4" />
                    </span>
                    <p className="mt-4 font-medium text-foreground">{node.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {node.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 px-4 py-4">
              <p className="text-sm text-muted-foreground">Client surface</p>
              <p className="mt-2 font-heading text-xl tracking-tight">
                Create, track and confirm deliveries
              </p>
            </div>
            <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 px-4 py-4">
              <p className="text-sm text-muted-foreground">Operator surface</p>
              <p className="mt-2 font-heading text-xl tracking-tight">
                Dispatch signals without noise
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
