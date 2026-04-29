import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, LifeBuoy } from "lucide-react";
import { PublicSection } from "@/components/layout/public-section";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Contact",
  "Use the SkySend contact page for support questions or business inquiries related to the current Pitesti delivery service.",
);

const contactChannels = [
  {
    title: "Support",
    description:
      "Use this path for order flow questions, coverage clarifications or delivery issues in the active Pitesti service.",
    detail: "Best for current product usage and operational questions.",
    icon: LifeBuoy,
  },
  {
    title: "Business inquiries",
    description:
      "Use this path for partnership, logistics integration or local deployment discussions around the active service.",
    detail: "Best for integrations, partnerships and operational coordination.",
    icon: BriefcaseBusiness,
  },
] as const;

const contactSignals = [
  {
    label: "Response path",
    value: "Support or business",
    hint: "Messages stay easy to route when the topic is clear from the start.",
  },
  {
    label: "Form style",
    value: "Short",
    hint: "Only the fields needed to understand the request are shown.",
  },
  {
    label: "Current scope",
    value: "Pitesti",
    hint: "The current contact surface is aligned with the live service area.",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="app-page-spacing">
      <section id="contact-overview" className="scroll-mt-28">
        <div className="flex flex-col gap-6">
          <PageHeader
            eyebrow="Contact"
            title="Reach SkySend for support or business questions."
            description="The contact flow stays short and direct. Use it for help with the current Pitesti delivery experience or for business conversations around local operations and integrations."
            actions={[
              {
                label: "Create delivery",
                href: "/client/create-delivery",
                variant: "default",
                icon: <ArrowRight className="size-4" />,
              },
              {
                label: "FAQ",
                href: "/faq",
                variant: "outline",
              },
            ]}
          />

          <div className="grid gap-4 md:grid-cols-3">
            {contactSignals.map((item) => (
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
        id="contact-channels"
        eyebrow="Contact Paths"
        title="Choose the route that matches the request."
        description="Support and business questions are separated so replies can stay clear and useful without forcing a long form."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          {contactChannels.map((channel) => {
            const Icon = channel.icon;

            return (
              <Card
                key={channel.title}
                className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]"
              >
                <CardContent className="grid gap-5 p-8">
                  <span className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-secondary/45 text-foreground">
                    <Icon className="size-5" />
                  </span>
                  <div className="space-y-3">
                    <h2 className="font-heading text-2xl tracking-tight">
                      {channel.title}
                    </h2>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {channel.description}
                    </p>
                    <p className="text-sm leading-7 text-foreground">
                      {channel.detail}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PublicSection>

      <PublicSection
        id="contact-form"
        eyebrow="Message"
        title="Send a short request."
        description="The form asks only for the essentials: who is writing, what the message is about and the context needed to reply."
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
          <SectionCard
            title="Contact form"
            description="Prepared for a future support or email handler, while already reflecting the final product structure."
            footer={
              <div className="flex flex-wrap gap-3">
                <AppButton type="submit" form="contact-form-fields" size="lg">
                  Send Message
                </AppButton>
                <AppButton asChild variant="outline" size="lg">
                  <Link href="/how-it-works">How It Works</Link>
                </AppButton>
              </div>
            }
          >
            <form id="contact-form-fields" className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Full name
                  </span>
                  <Input type="text" placeholder="Your name" />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Email
                  </span>
                  <Input type="email" placeholder="name@company.com" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Topic
                  </span>
                  <select
                    defaultValue="support"
                    className="h-12 rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-primary/15 focus-visible:ring-4 focus-visible:ring-ring"
                  >
                    <option value="support">Support</option>
                    <option value="business">Business inquiry</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Order reference
                  </span>
                  <Input type="text" placeholder="Optional" />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Message
                </span>
                <textarea
                  placeholder="Tell us what you need help with."
                  className="min-h-40 rounded-[var(--ui-radius-card)] border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/90 focus-visible:border-primary/15 focus-visible:ring-4 focus-visible:ring-ring"
                />
              </label>
            </form>
          </SectionCard>

          <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
            <CardContent className="grid gap-5 p-8">
              <Badge variant="outline">Contact note</Badge>
              <div className="space-y-3">
                <h2 className="type-h2">Built for useful replies, not long intake forms.</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  The contact surface stays light on purpose. It is designed to
                  collect enough context for support or business follow-up without
                  slowing down the user with unnecessary fields.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  "Support questions can reference coverage, order flow or a delivery state.",
                  "Business inquiries can cover partnerships, integrations or local operations.",
                  "The same structure can later connect to Resend or a server action without changing the page UX.",
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
    </div>
  );
}
