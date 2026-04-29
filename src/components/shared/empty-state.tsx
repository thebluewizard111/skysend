import Link from "next/link";
import type { ReactNode } from "react";
import { PackageSearch } from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { Card, CardContent } from "@/components/ui/card";
import type { EmptyStateAction } from "@/types/ui";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
};

function EmptyAction({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant: "default" | "outline";
}) {
  if (action.href) {
    return (
      <AppButton asChild variant={variant}>
        <Link href={action.href}>{action.label}</Link>
      </AppButton>
    );
  }

  return (
    <AppButton type="button" variant={variant} onClick={action.onClick}>
      {action.label}
    </AppButton>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Card className="rounded-[var(--ui-radius-panel)]">
      <CardContent className="flex flex-col items-start gap-5 p-8 md:p-10">
        <span className="flex size-14 items-center justify-center rounded-[1.25rem] bg-secondary text-foreground">
          {icon ?? <PackageSearch className="size-6" />}
        </span>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl tracking-tight">{title}</h2>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </div>
        {primaryAction || secondaryAction ? (
          <div className="flex flex-wrap gap-2">
            {primaryAction ? (
              <EmptyAction action={primaryAction} variant="default" />
            ) : null}
            {secondaryAction ? (
              <EmptyAction action={secondaryAction} variant="outline" />
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
