import Link from "next/link";
import { ArrowRight, CalendarClock, Gauge, Zap } from "lucide-react";
import { PublicSection } from "@/components/layout/public-section";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Pricing",
  "See the current pricing model for Standard, Priority and Scheduled drone deliveries in Pitesti.",
);

const pricingPlans = [
  {
    name: "Standard",
    description:
      "Built for normal same-day requests inside the active Pitesti zone, with a balanced delivery window and restrained pricing.",
    eta: "25-40 min",
    pricing: "Starts from 24 RON, then adjusts lightly with route distance and parcel handling.",
    icon: Gauge,
    highlight: "Best for routine urban deliveries.",
  },
  {
    name: "Priority",
    description:
      "For faster operational dispatch when the order needs to move earlier in the queue and reach the drop-off with tighter timing.",
    eta: "12-25 min",
    pricing: "Starts from 36 RON, with a higher urgency component and availability-based adjustment.",
    icon: Zap,
    highlight: "Best for urgent medical, office or time-sensitive items.",
  },
  {
    name: "Scheduled",
    description:
      "For deliveries planned ahead, when pickup and drop-off are known in advance and the handoff window can be reserved.",
    eta: "Chosen time window",
    pricing: "Starts from 22 RON, then adjusts by distance and parcel profile within the reserved slot.",
    icon: CalendarClock,
    highlight: "Best for predictable daily or next-slot deliveries.",
  },
] as const;

const pricingFactors = [
  {
    title: "Distance",
    body: "Longer routes inside the active Pitesti zone can increase the final amount above the base starting price.",
  },
  {
    title: "Parcel type",
    body: "Packaging, size and handling needs can shift the estimate when the order requires a different drone class or more careful transport.",
  },
  {
    title: "Urgency",
    body: "Priority requests carry a stronger urgency component because they can move earlier in the dispatch queue.",
  },
  {
    title: "Operational availability",
    body: "Live fleet state and active corridor capacity can influence the final estimate at the moment of confirmation.",
  },
] as const;

const pricingSignals = [
  {
    label: "Active city",
    value: "Pitesti",
    hint: "Pricing currently applies only to the active Pitesti service area.",
  },
  {
    label: "Price style",
    value: "Estimate first",
    hint: "The interface shows a restrained estimate before the order is confirmed.",
  },
  {
    label: "Final logic",
    value: "Route-based",
    hint: "The final amount depends on route fit, parcel profile and live operational context.",
  },
] as const;

export default function PricingPage() {
  return (
    <div className="app-page-spacing">
      <section id="pricing-overview" className="scroll-mt-28">
        <div className="flex flex-col gap-6">
          <PageHeader
            eyebrow="Pricing"
            title="Simple pricing, shown as a live delivery estimate."
            description="SkySend uses a restrained pricing model for Pitesti: clear base logic for each delivery type, then a visible estimate that can change with distance, parcel profile, urgency and live operational availability."
            actions={[
              {
                label: "Create delivery",
                href: "/client/create-delivery",
                variant: "default",
                icon: <ArrowRight className="size-4" />,
              },
              {
                label: "View coverage",
                href: "/coverage",
                variant: "outline",
              },
            ]}
          />

          <div className="grid gap-4 md:grid-cols-3">
            {pricingSignals.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                hint={item.hint}
              />
            ))}
          </div>
        </div>
      </section>

      <PublicSection
        id="delivery-types"
        eyebrow="Delivery Types"
        title="Three clear delivery modes for the current service."
        description="The pricing model stays readable: choose the delivery mode first, then review the estimate in the order flow."
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => {
            const Icon = plan.icon;

            return (
              <Card
                key={plan.name}
                className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]"
              >
                <CardHeader className="gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">{plan.name}</Badge>
                    <span className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-secondary/45 text-foreground">
                      <Icon className="size-5" />
                    </span>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5">
                  <p className="text-sm leading-7 text-muted-foreground">
                    {plan.description}
                  </p>

                  <div className="grid gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated time</p>
                      <p className="mt-2 font-heading text-2xl tracking-tight">
                        {plan.eta}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pricing logic</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {plan.pricing}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm leading-7 text-foreground">{plan.highlight}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PublicSection>

      <PublicSection
        id="pricing-factors"
        eyebrow="Pricing Factors"
        title="The final estimate depends on a few visible inputs."
        description="SkySend avoids heavy tariff language. The order flow simply shows how the current estimate can move before confirmation."
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.95fr)]">
          <SectionCard
            title="What can change the final price"
            description="The estimate is not fixed until the route and parcel profile are confirmed."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {pricingFactors.map((factor) => (
                <div
                  key={factor.title}
                  className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5"
                >
                  <h2 className="font-heading text-lg tracking-tight">
                    {factor.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {factor.body}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
            <CardContent className="grid gap-5 p-8">
              <Badge variant="outline">Pricing note</Badge>
              <div className="space-y-3">
                <h2 className="type-h2">Estimates stay operational, not absolute.</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  Prices shown on this page are reference estimates for the current
                  Pitesti service. The amount seen in the delivery flow can depend
                  on distance, parcel type, urgency and live operational
                  availability at the time of confirmation.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  "Base pricing keeps the page readable before an order exists.",
                  "The create-delivery flow can later return a more precise estimate.",
                  "The current structure is ready to support additional cities and pricing rules later.",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4 text-sm leading-7 text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PublicSection>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)]">
        <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
          <CardContent className="grid gap-6 p-8 md:p-10">
            <div className="space-y-3">
              <Badge variant="outline">Use SkySend</Badge>
              <h2 className="type-h2">See the estimate in the actual delivery flow.</h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                The pricing page explains the model. The order flow applies it to
                a real route, parcel profile and urgency level inside the active
                Pitesti zone.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <AppButton asChild size="lg">
                <Link href="/client/create-delivery">Create delivery</Link>
              </AppButton>
              <AppButton asChild variant="outline" size="lg">
                <Link href="/how-it-works">How it works</Link>
              </AppButton>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[calc(var(--radius)+0.5rem)]">
          <CardContent className="grid gap-3 p-6">
            <p className="text-sm text-muted-foreground">Pricing scope</p>
            <p className="font-heading text-2xl tracking-tight">Current model for Pitesti.</p>
            <p className="text-sm leading-7 text-muted-foreground">
              The structure is intentionally simple so the page reads like part of
              a working product, not a commercial brochure.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
