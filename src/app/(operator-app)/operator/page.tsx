import { ClipboardCheck, Route, TriangleAlert } from "lucide-react";
import { OperatorDashboardView } from "@/components/operator/operator-dashboard-view";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { roleConfigs } from "@/constants/roles";
import { createPageMetadata } from "@/lib/metadata";
import { getOperatorDashboardData } from "@/lib/operator-dashboard";

const config = roleConfigs.operator;

export const metadata = createPageMetadata(
  `${config.label} Dashboard`,
  "Task-focused operator dashboard for SkySend delivery work in Pitesti.",
);

export default function OperatorDashboardPage() {
  const data = getOperatorDashboardData();

  return (
    <section className="flex flex-col gap-8">
      <div className="app-container flex flex-col gap-6">
        <PageHeader
          eyebrow="Operator Dashboard"
          title="Task board for the active Pitesti shift."
          description="This workspace prioritizes what the operator must do next: current assignment, pickup validation, drop-off validation and incident handling."
          actions={[
            {
              label: "Current Task",
              href: "/operator/validation",
              variant: "default",
              icon: <ClipboardCheck className="size-4" />,
            },
            {
              label: "Validations",
              href: "#pads",
              variant: "outline",
              icon: <Route className="size-4" />,
            },
            {
              label: "Incidents",
              href: "#alerts",
              variant: "outline",
              icon: <TriangleAlert className="size-4" />,
            },
          ]}
        />

        <Card
          id="overview"
          className="scroll-mt-24 rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]"
        >
          <CardContent className="grid gap-5 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge label="Pitesti live" tone="success" />
              <StatusBadge label="Task-first workspace" tone="info" />
            </div>

            <div className="space-y-3">
              <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
                Operator work starts from the next required action.
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                The operator view avoids analytics noise. It keeps mission
                execution, pickup/drop-off validation and incident response close
                together so the active shift stays easy to scan.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <OperatorDashboardView data={data} />
    </section>
  );
}
