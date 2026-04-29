import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPinned, Navigation, XCircle } from "lucide-react";
import { CoverageMapPreview } from "@/components/maps/coverage-map-preview";
import { PublicSection } from "@/components/layout/public-section";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { serviceAreaConfig } from "@/constants/service-area";
import { createPageMetadata } from "@/lib/metadata";
import {
  getServiceAreaUnavailableMessage,
  isGeocodedAddressEligible,
} from "@/lib/service-area";
import type { GeocodedAddress } from "@/types/service-area";

export const metadata = createPageMetadata(
  "Coverage in Pitesti",
  "SkySend is currently available only inside the active Pitesti service area. Both pickup and drop-off must stay inside coverage before a delivery can be confirmed.",
);

const addressExamples: GeocodedAddress[] = [
  {
    formattedAddress: "Piata Vasile Milea, Pitesti, Arges",
    location: {
      latitude: 44.8576,
      longitude: 24.8724,
    },
    city: "Pitesti",
    county: "Arges",
    country: "Romania",
  },
  {
    formattedAddress: "Bulevardul Petrochimistilor, Pitesti, Arges",
    location: {
      latitude: 44.8298,
      longitude: 24.8981,
    },
    city: "Pitesti",
    county: "Arges",
    country: "Romania",
  },
  {
    formattedAddress: "Mioveni, Arges",
    location: {
      latitude: 44.9592,
      longitude: 24.9418,
    },
    city: "Mioveni",
    county: "Arges",
    country: "Romania",
  },
] as const;

const addressChecks = addressExamples.map((address) => ({
  address,
  result: isGeocodedAddressEligible(address),
}));

const coverageRules = [
  {
    title: "One active city",
    body: "SkySend is live now only in Pitesti. The page shows the current service area as an operational boundary, not as a vague future plan.",
  },
  {
    title: "Both points must be inside coverage",
    body: "Pickup and drop-off are checked against the active zone before the delivery can move forward, so the route stays feasible from the start.",
  },
  {
    title: "The model can grow later",
    body: "The current page is city-specific for Pitesti, while the coverage logic is already structured to support additional cities or polygon-based zones later.",
  },
] as const;

export default function CoveragePage() {
  const outsideMessage = getServiceAreaUnavailableMessage();

  return (
    <div className="app-page-spacing">
      <section id="coverage-overview" className="scroll-mt-28">
        <div className="flex flex-col gap-6">
          <PageHeader
            eyebrow="Coverage"
            title="SkySend is active now only inside the Pitesti service area."
            description="The current network is intentionally limited to Pitesti, Arges. Both pickup and drop-off must stay inside the active zone before a delivery can be created and dispatched."
            actions={[
              {
                label: "Create delivery",
                href: "/client/create-delivery",
                variant: "default",
                icon: <ArrowRight className="size-4" />,
              },
              {
                label: "How It Works",
                href: "/how-it-works",
                variant: "outline",
              },
            ]}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Active city"
              value={serviceAreaConfig.cityName}
              hint="The service is available now only inside the current Pitesti zone."
            />
            <StatCard
              label="Coverage model"
              value={`${serviceAreaConfig.coverageRadiusKm} km`}
              hint="The active area currently uses a simple radial boundary centered on Pitesti."
            />
            <StatCard
              label="Route condition"
              value="Both points"
              hint="Pickup and drop-off must both be inside coverage before the order can be confirmed."
            />
          </div>
        </div>
      </section>

      <PublicSection
        id="pitesti-map"
        eyebrow="Pitesti Map"
        title="The active zone is visible on the map."
        description="The current service area, central hub and service points are shown in one clean surface so coverage can be understood quickly on desktop and mobile."
      >
        <CoverageMapPreview />
      </PublicSection>

      <PublicSection
        id="coverage-rules"
        eyebrow="Coverage Rules"
        title="Delivery creation starts with a simple coverage check."
        description="The rule set stays short: SkySend is currently active in Pitesti, and both route points have to remain inside the live zone."
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.95fr)]">
          <SectionCard
            title="What the current coverage means in practice"
            description="The page keeps the limit explicit so the product feels predictable instead of overly broad."
          >
            <div className="grid gap-4">
              {coverageRules.map((item) => (
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

          <SectionCard
            eyebrow="Route validation"
            title="Pickup and drop-off are evaluated together."
            description="A delivery cannot move into the live flow if one of the two points sits outside the active Pitesti zone."
          >
            <div className="grid gap-4">
              {[
                "Choose a pickup point inside the current Pitesti coverage area.",
                "Choose a drop-off point inside the same active zone.",
                "Continue only when both points pass the coverage check.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-background p-4"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-secondary/50 text-foreground">
                    <Navigation className="size-4" />
                  </span>
                  <p className="text-sm leading-7 text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </PublicSection>

      <PublicSection
        id="address-status"
        eyebrow="Address Status"
        title="Addresses outside the zone get a clear, calm response."
        description="Coverage limits are communicated as the current operating boundary, not as an error state. That keeps the product honest without making it feel broken."
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
          <SectionCard
            title="Example address checks"
            description="Example results show how the coverage logic guides the create-delivery flow."
          >
            <div className="grid gap-4">
              {addressChecks.map(({ address, result }) => {
                const isCovered = result.isEligible;

                return (
                  <div
                    key={address.formattedAddress}
                    className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline">{address.city}</Badge>
                      <StatusBadge
                        label={isCovered ? "Inside coverage" : "Outside coverage"}
                        tone={isCovered ? "success" : "warning"}
                      />
                    </div>
                    <h2 className="mt-4 font-heading text-lg tracking-tight">
                      {address.formattedAddress}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {result.message}
                    </p>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
            <CardContent className="grid gap-5 p-8">
              <StatusBadge label="Outside active zone" tone="warning" />
              <div className="space-y-3">
                <h2 className="type-h2">What users see when an address is not eligible.</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  {outsideMessage}
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex items-start gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-foreground" />
                  <p className="text-sm leading-7 text-muted-foreground">
                    The message explains the current live zone clearly and keeps the
                    interaction calm.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                  <MapPinned className="mt-0.5 size-4 shrink-0 text-foreground" />
                  <p className="text-sm leading-7 text-muted-foreground">
                    Coverage remains framed as a visible operating boundary, not as
                    a hidden limitation discovered too late.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
                  <XCircle className="mt-0.5 size-4 shrink-0 text-foreground" />
                  <p className="text-sm leading-7 text-muted-foreground">
                    The order simply does not proceed until both addresses fit the
                    active service area.
                  </p>
                </div>
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
              <h2 className="type-h2">Create a delivery only when the route fits the active zone.</h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                The current page is specific to Pitesti so coverage stays easy to
                understand. The underlying structure is already prepared for future
                cities, but the live product remains precise about where it works
                today.
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
            <p className="text-sm text-muted-foreground">Coverage note</p>
            <p className="font-heading text-2xl tracking-tight">Pitesti is the only active city.</p>
            <p className="text-sm leading-7 text-muted-foreground">
              That limit is shown deliberately so delivery creation feels grounded,
              predictable and operational from the first screen.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
