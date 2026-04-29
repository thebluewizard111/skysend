"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { getRecipientTrackingPath } from "@/lib/recipient-tracking";

type RecipientTrackingLinkCardProps = {
  orderId: string;
  missionId?: string | null;
  compact?: boolean;
};

function getAbsoluteRecipientLink(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  return new URL(path, window.location.origin).toString();
}

export function RecipientTrackingLinkCard({
  orderId,
  missionId,
  compact = false,
}: RecipientTrackingLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const recipientPath = getRecipientTrackingPath({ missionId, orderId });
  const linkLabel = missionId
    ? "Recipient link attached to live mission"
    : "Recipient link reserved for this order";

  const handleCopy = async () => {
    const absoluteLink = getAbsoluteRecipientLink(recipientPath);

    await navigator.clipboard.writeText(absoluteLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full border border-border bg-background">
              <Link2 className="size-4 text-foreground" />
            </span>
            <div>
              <p className="font-medium text-foreground">Recipient tracking link</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {linkLabel}
              </p>
            </div>
            <StatusBadge
              label={missionId ? "Mission link" : "Order link"}
              tone={missionId ? "success" : "info"}
            />
          </div>
          <p className="mt-3 truncate rounded-[var(--radius)] border border-border/80 bg-background px-3 py-2 text-sm text-muted-foreground">
            {recipientPath}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 md:min-w-80">
          <AppButton
            type="button"
            variant="outline"
            size={compact ? "default" : "lg"}
            onClick={handleCopy}
            className="w-full"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy recipient link"}
          </AppButton>
          <AppButton
            asChild
            variant="secondary"
            size={compact ? "default" : "lg"}
            className="w-full"
          >
            <Link href={recipientPath}>
              <ExternalLink className="size-4" />
              Open recipient view
            </Link>
          </AppButton>
        </div>
      </div>
    </div>
  );
}
