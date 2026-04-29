import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  trend?: ReactNode;
};

export function StatCard({ label, value, hint, trend }: StatCardProps) {
  return (
    <Card className="rounded-[calc(var(--radius)+0.375rem)] bg-card/95">
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          {trend ? <span className="shrink-0">{trend}</span> : null}
        </div>
        <strong className="font-heading text-3xl tracking-tight">{value}</strong>
        {hint ? (
          <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
