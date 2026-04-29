import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicSection } from "@/components/layout/public-section";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "FAQ",
  "Answers to the main operational questions about SkySend in Pitesti, including coverage, parcel estimates, delivery failures and secure payments.",
);

const faqItems = [
  {
    question: "Is SkySend available everywhere in Romania?",
    answer:
      "No. In this stage, SkySend is active only inside the current Pitesti service area. The product shows that limit early so delivery creation stays clear and predictable.",
  },
  {
    question: "How are pickup and drop-off points chosen?",
    answer:
      "The order starts with route selection. Both points are chosen from valid addresses or service points inside the active Pitesti zone so the route can be evaluated before confirmation.",
  },
  {
    question: "What happens if one address is outside the coverage area?",
    answer:
      "The delivery does not move forward until both points are inside coverage. The interface returns a calm availability message instead of letting the order fail later in the flow.",
  },
  {
    question: "How does parcel estimation work?",
    answer:
      "The current estimate uses operational rules based on parcel description, packaging and approximate size. It returns a weight range, a handling signal and a suggested drone class.",
  },
  {
    question: "What happens if a delivery fails?",
    answer:
      "A failed order is surfaced as an operational state, not hidden. The client and operator can review the status, and the flow can later support retry, reschedule or manual follow-up.",
  },
  {
    question: "How does payment work?",
    answer:
      "Pricing is shown before dispatch and card details are handled by Stripe. SkySend keeps payment status visible without storing card numbers.",
  },
] as const;

const faqSignals = [
  {
    label: "Active city",
    value: "Pitesti",
    hint: "Coverage answers stay tied to the current live service area.",
  },
  {
    label: "Flow logic",
    value: "Operational",
    hint: "Questions are answered from the point of view of a real delivery flow, not a marketing deck.",
  },
  {
    label: "Answer style",
    value: "Short",
    hint: "Each response stays compact so users can find the practical rule quickly.",
  },
] as const;

export default function FaqPage() {
  return (
    <div className="app-page-spacing">
      <section id="faq-overview" className="scroll-mt-28">
        <div className="flex flex-col gap-6">
          <PageHeader
            eyebrow="FAQ"
            title="Useful answers for the live Pitesti delivery flow."
            description="These questions focus on how SkySend works today: coverage in Pitesti, route selection, parcel estimation, failed deliveries and secure payment handling."
            actions={[
              {
                label: "Create delivery",
                href: "/client/create-delivery",
                variant: "default",
                icon: <ArrowRight className="size-4" />,
              },
              {
                label: "Contact",
                href: "/contact",
                variant: "outline",
              },
            ]}
          />

          <div className="grid gap-4 md:grid-cols-3">
            {faqSignals.map((item) => (
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
        id="faq-list"
        eyebrow="Common Questions"
        title="Short answers for the decisions users make most often."
        description="The goal is to explain the current product behavior in plain language, without jargon and without long support-style paragraphs."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {faqItems.map((item, index) => (
            <SectionCard
              key={item.question}
              eyebrow={`Q${index + 1}`}
              title={item.question}
              description={item.answer}
            >
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4 text-sm leading-7 text-muted-foreground">
                {item.answer}
              </div>
            </SectionCard>
          ))}
        </div>
      </PublicSection>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)]">
        <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
          <CardContent className="grid gap-6 p-8 md:p-10">
            <div className="space-y-3">
              <Badge variant="outline">Still need help?</Badge>
              <h2 className="type-h2">Move from FAQs to the actual product flow.</h2>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                The FAQ explains the current rules. The delivery flow applies
                them to a real route, parcel profile and active coverage area in
                Pitesti.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <AppButton asChild size="lg">
                <Link href="/client/create-delivery">Create delivery</Link>
              </AppButton>
              <AppButton asChild variant="outline" size="lg">
                <Link href="/coverage">View coverage</Link>
              </AppButton>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[calc(var(--radius)+0.5rem)]">
          <CardContent className="grid gap-3 p-6">
            <p className="text-sm text-muted-foreground">FAQ scope</p>
            <p className="font-heading text-2xl tracking-tight">Focused on the current product.</p>
            <p className="text-sm leading-7 text-muted-foreground">
              The answers are intentionally tied to the live Pitesti experience so
              the page remains useful as the product evolves.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
