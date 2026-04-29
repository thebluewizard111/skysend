import Link from "next/link";
import {
  CheckCircle2,
  MapPinned,
  Package2,
  Radar,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PublicSection } from "@/components/layout/public-section";
import { CoverageMapPreview } from "@/components/maps/coverage-map-preview";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "How It Works",
  "See how SkySend works in Pitesti, from pickup and drop-off selection to parcel details, drone recommendation, tracking and delivery confirmation.",
);

const deliveryFlow = [
  {
    step: "01",
    title: "Enter pickup and drop-off",
    description:
      "Start with the two delivery points so the order begins in a real route context, not as a vague request.",
    icon: Route,
  },
  {
    step: "02",
    title: "Choose valid points in Pitesti",
    description:
      "Select addresses or service points inside the active Pitesti area. Coverage is checked early so the flow stays honest.",
    icon: MapPinned,
  },
  {
    step: "03",
    title: "Add parcel details",
    description:
      "Describe the parcel, choose the packaging and set the approximate size so the mission can be evaluated correctly.",
    icon: Package2,
  },
  {
    step: "04",
    title: "Review the estimate and drone fit",
    description:
      "SkySend shows a restrained estimate, a parcel handling signal and a recommended drone class before the order is confirmed.",
    icon: Sparkles,
  },
  {
    step: "05",
    title: "Confirm the order",
    description:
      "Once the route and parcel profile make sense, the request becomes a confirmed delivery ready for dispatch.",
    icon: CheckCircle2,
  },
  {
    step: "06",
    title: "Track the delivery",
    description:
      "The client can follow state, ETA and route progress through one clean tracking surface until arrival.",
    icon: Radar,
  },
  {
    step: "07",
    title: "Recipient validates handoff",
    description:
      "The flow ends with delivery confirmation, so both sides can see that the parcel was received and closed correctly.",
    icon: ShieldCheck,
  },
] as const;

const operatingSignals = [
  {
    label: "Active city",
    value: "Pitesti",
    hint: "The live service area is currently limited to Pitesti, Arges.",
  },
  {
    label: "Coverage check",
    value: "Early",
    hint: "Pickup and drop-off are validated before the order is released.",
  },
  {
    label: "Tracking",
    value: "Visible",
    hint: "Order state, ETA and confirmation remain readable through one flow.",
  },
] as const;

const supportingPoints = [
  {
    title: "Why the route comes first",
    body: "Pickup and drop-off are entered before anything else because operational feasibility starts with location, not with marketing copy or generic promises.",
  },
  {
    title: "Why the parcel details matter",
    body: "Packaging, size and contents help the system produce a restrained estimate and a drone recommendation that can later be replaced by more advanced logic.",
  },
  {
    title: "Why Pitesti is explicit",
    body: "SkySend is active now, but only inside the current Pitesti zone. Keeping that visible makes the product more trustworthy and easier to use.",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <div className="app-page-spacing">
      <section id="how-it-works-overview" className="scroll-mt-28">
        <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="How It Works"
          title="A clear delivery flow, from route input to validated handoff."
          description="SkySend works like a live logistics product: enter pickup and drop-off, stay inside the active Pitesti zone, confirm the parcel profile, review the estimate and follow the delivery until the recipient validates receipt."
          actions={[
            { label: "Create delivery", href: "/client/create-delivery", variant: "default" },
            { label: "Track mission", href: "/sign-in", variant: "outline" },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
          <SectionCard
            eyebrow="Flow Overview"
            title="The service stays short, readable and operational."
            description="Each step adds only the information needed to move a delivery forward inside the active city zone."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {deliveryFlow.slice(0, 4).map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.step}
                    className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="outline">{item.step}</Badge>
                      <span className="flex size-10 items-center justify-center rounded-2xl border border-border/80 bg-background text-foreground">
                        <Icon className="size-4" />
                      </span>
                    </div>
                    <h2 className="mt-4 font-heading text-xl tracking-tight">
                      {item.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <div className="grid gap-4">
            {operatingSignals.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
              />
            ))}
          </div>
        </div>
        </div>
      </section>

      <PublicSection
        id="delivery-journey"
        eyebrow="Delivery Journey"
        title="From parcel setup to delivery confirmation."
        description="The second half of the flow keeps the order grounded in real operations: estimate, confirm, track and validate."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {deliveryFlow.slice(4).map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.step} className="rounded-[calc(var(--radius)+0.5rem)]">
                <CardContent className="grid gap-4 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">{item.step}</Badge>
                    <span className="flex size-10 items-center justify-center rounded-2xl border border-border/80 bg-secondary/45 text-foreground">
                      <Icon className="size-4" />
                    </span>
                  </div>
                  <div className="space-y-3">
                    <h2 className="font-heading text-xl tracking-tight">
                      {item.title}
                    </h2>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PublicSection>

      <PublicSection
        id="pitesti-coverage"
        eyebrow="Pitesti Coverage"
        title="The route must stay inside the active zone."
        description="SkySend is available now, but only for deliveries that fit the current Pitesti coverage area. That constraint is shown early so the experience stays credible."
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <CoverageMapPreview />

          <SectionCard
            title="Why this makes the product easier to trust"
            description="The service behaves more like a real mobility platform when availability is precise, visible and enforced before confirmation."
          >
            <div className="grid gap-4">
              {supportingPoints.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5"
                >
                  <h2 className="font-heading text-lg tracking-tight">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </PublicSection>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
          <CardContent className="grid gap-6 p-8 md:p-10">
            <div className="space-y-3">
              <Badge variant="outline">Use SkySend</Badge>
              <h2 className="type-h2">Create the order or follow one already in motion.</h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                If both points are inside the Pitesti zone, you can move directly
                into the delivery flow. If the order already exists, tracking
                keeps the state, ETA and confirmation visible until handoff.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <AppButton asChild size="lg">
                <Link href="/client/create-delivery">Create delivery</Link>
              </AppButton>
              <AppButton asChild variant="outline" size="lg">
                <Link href="/sign-in">Track mission</Link>
              </AppButton>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[calc(var(--radius)+0.5rem)]">
          <CardContent className="grid gap-3 p-6">
            <p className="text-sm text-muted-foreground">Service note</p>
            <p className="font-heading text-2xl tracking-tight">Active now in Pitesti.</p>
            <p className="text-sm leading-7 text-muted-foreground">
              Coverage is intentionally limited in this stage, so each order can
              stay clear, trackable and grounded in the current service area.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
