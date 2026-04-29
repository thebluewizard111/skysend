import Link from "next/link";
import { Bolt, MapPinned, ShieldCheck, TimerReset } from "lucide-react";
import { CoverageMapPreview } from "@/components/maps/coverage-map-preview";
import { PublicSection } from "@/components/layout/public-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { MotionProvider } from "@/components/motion/motion-provider";
import { MotionReveal } from "@/components/motion/motion-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Drone Delivery in Pitesti",
  "SkySend is a live urban drone delivery platform for Pitesti, with fast order creation, clear tracking and visible coverage.",
);

const productSignals = [
  {
    title: "Speed",
    body: "Orders are created quickly, released inside the active zone and tracked through one clear delivery flow.",
    icon: TimerReset,
  },
  {
    title: "Live route clarity",
    body: "Pickup, drop-off, ETA and mission state stay visible through a focused operational flow.",
    icon: MapPinned,
  },
  {
    title: "Safety",
    body: "Coverage is bounded, dispatch is validated and each mission stays visible from request to confirmation.",
    icon: ShieldCheck,
  },
] as const;

const productActions = [
  {
    label: "Create a delivery",
    value: "Pickup, drop-off and parcel details in one short flow.",
  },
  {
    label: "Track the order",
    value: "ETA, route state and delivery confirmation stay visible.",
  },
  {
    label: "Stay inside coverage",
    value: "Service is live now only in Pitesti and clearly bounded on the map.",
  },
] as const;

const quickStats = [
  {
    label: "Active service area",
    value: "Pitesti",
    hint: "The live delivery zone is currently limited to the active city boundary.",
  },
  {
    label: "Order flow",
    value: "Fast",
    hint: "Create, dispatch and track the order without extra routing noise.",
  },
  {
    label: "Tracking view",
    value: "Clear",
    hint: "Live state, ETA and confirmation stay visible through one clean surface.",
  },
] as const;

export default function Home() {
  return (
    <MotionProvider>
      <MotionReveal preset="page" inView={false}>
        <HeroSection />
      </MotionReveal>

      <MotionReveal delay={0.04}>
        <PublicSection
          id="how-it-works"
          eyebrow="How It Works"
          title="The order flow stays short and visible."
          description="SkySend works like a live mobility product: create the delivery, dispatch inside the active zone and track the order to handoff."
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
              <CardContent className="grid gap-4 p-6 md:p-8">
                {productActions.map((item, index) => (
                  <div
                    key={item.label}
                    className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{`0${index + 1}`}</Badge>
                      <p className="font-medium text-foreground">{item.label}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {item.value}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[var(--ui-radius-panel)]">
              <CardHeader className="gap-3">
                <Badge variant="outline">Tracking Preview</Badge>
                <CardTitle className="text-2xl">
                  One order, one readable state.
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                {[
                  {
                    label: "Order",
                    value: "PX-2048",
                    note: "Pickup confirmed in Pitesti city zone.",
                  },
                  {
                    label: "Current state",
                    value: "In flight",
                    note: "Route released and ETA visible to the client.",
                  },
                  {
                    label: "Arrival",
                    value: "12 min",
                    note: "Drop-off stays verified until confirmation is complete.",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-card px-4 py-4"
                  >
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="mt-2 font-heading text-2xl tracking-tight">
                      {item.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.note}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </PublicSection>
      </MotionReveal>

      <MotionReveal delay={0.08}>
        <PublicSection
          id="coverage"
          eyebrow="Coverage In Pitesti"
          title="Live now in the active city zone."
          description="Coverage is visible, bounded and easy to verify before a delivery is created."
        >
          <CoverageMapPreview />
        </PublicSection>
      </MotionReveal>

      <MotionReveal delay={0.12}>
        <PublicSection
          id="product-signals"
          eyebrow="Service Signals"
          title="Built for speed, clarity and trust."
          description="The product stays restrained: the essentials are visible, the current city is explicit and the interface never over-explains itself."
        >
          <div className="grid gap-5 md:grid-cols-3">
            {productSignals.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.title}>
                  <CardHeader className="gap-4">
                    <span className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-secondary/50 text-foreground">
                      <Icon className="size-5" />
                    </span>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {item.body}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </PublicSection>
      </MotionReveal>

      <MotionReveal delay={0.16}>
        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
          <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
            <CardContent className="grid gap-6 p-8 md:p-10">
              <div className="space-y-3">
                <Badge variant="outline">Use SkySend</Badge>
                <h2 className="type-h2">Open the live delivery flow.</h2>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  Create a delivery if pickup and drop-off are inside the active
                  Pitesti zone, or sign in to follow an order already in motion.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/client/create-delivery">
                    Create delivery
                    <Bolt className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/sign-in">Track mission</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {quickStats.map((item) => (
              <Card key={item.label} className="rounded-[calc(var(--radius)+0.5rem)]">
                <CardContent className="grid gap-2 p-6">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-heading text-3xl tracking-tight">
                    {item.value}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.hint}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </MotionReveal>
    </MotionProvider>
  );
}
