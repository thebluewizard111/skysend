"use client";

import { useState } from "react";
import { WandSparkles } from "lucide-react";
import { LazyParcelAssistantPanel } from "@/components/parcel-assistant/lazy-parcel-assistant-panel";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

export function ParcelAssistantEntry() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="grid gap-5">
        <PageHeader
          eyebrow="Order Creation"
          title="Parcel Assistant foundation"
          description="A reusable parcel guidance module for the create-order flow, designed as a panel instead of a floating chatbot."
          actions={[
            {
              label: "Open Assistant",
              onClick: () => setOpen(true),
              variant: "default",
              icon: <WandSparkles className="size-4" />,
            },
          ]}
        />

        <SectionCard
          eyebrow="Why Here"
          title="Built for delivery intake"
          description="This module belongs inside structured order creation. It helps collect better dispatch data before a mission is assigned."
        >
          <div className="grid gap-3 md:grid-cols-3">
            {[
              "Content description captures context a photo alone often misses.",
              "Packaging and size drive safer routing than image-only assumptions.",
              "The same panel can later connect to pricing, restrictions, and recommendation logic.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/50 px-4 py-4 text-sm leading-6 text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <AppButton type="button" onClick={() => setOpen(true)}>
              <WandSparkles className="size-4" />
              Launch Parcel Assistant
            </AppButton>
          </div>
        </SectionCard>
      </section>

      {open ? (
        <LazyParcelAssistantPanel open={open} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}
