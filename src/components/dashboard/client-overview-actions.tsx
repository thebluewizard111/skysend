import Link from "next/link";
import { PackagePlus, Radar, Rows3 } from "lucide-react";
import { AppButton } from "@/components/shared/app-button";

type ClientOverviewActionsProps = {
  latestOrderLabel?: string | null;
  latestOrderHref?: string | null;
};

export function ClientOverviewActions({
  latestOrderLabel,
  latestOrderHref,
}: ClientOverviewActionsProps) {
  return (
    <div className="grid gap-3">
      <AppButton asChild size="lg">
        <Link href="/client/create-delivery">
          <PackagePlus className="size-4" />
          Create delivery
        </Link>
      </AppButton>

      <div className="grid gap-3 sm:grid-cols-2">
        <AppButton asChild variant="outline" size="lg">
          <Link href={latestOrderHref ?? "/client/orders"}>
            <Radar className="size-4" />
            Track mission
          </Link>
        </AppButton>

        <AppButton asChild variant="ghost" size="lg">
          <Link href="/client/orders">
            <Rows3 className="size-4" />
            View orders
          </Link>
        </AppButton>
      </div>

      <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 px-4 py-4 text-sm leading-7 text-muted-foreground">
        {latestOrderLabel ? (
          <>
            Latest live order:{" "}
            <span className="font-medium text-foreground">{latestOrderLabel}</span>
            . Start a new delivery from the dedicated flow or open the latest
            order for tracking and status review.
          </>
        ) : (
          <>
            Start a new delivery from the dedicated flow or open the orders list
            for tracking and recent activity in Pitesti.
          </>
        )}
      </div>
    </div>
  );
}
