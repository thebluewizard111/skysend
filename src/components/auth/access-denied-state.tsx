import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { roleHomePaths, roleLabels } from "@/constants/roles";
import type { UserRole } from "@/types/roles";
import { AppButton } from "@/components/shared/app-button";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";

export function AccessDeniedState({
  requiredRole,
  currentRole,
  reason,
}: {
  requiredRole?: UserRole | null;
  currentRole?: UserRole | null;
  reason?: "invalid-role" | "no-role" | null;
}) {
  const missingRole = reason === "no-role" || (!requiredRole && !currentRole);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Protected Route"
        title={
          missingRole
            ? "No workspace role is available for this account"
            : "Access is not available for this workspace"
        }
        description={
          missingRole
            ? "Authentication succeeded, but this account does not currently have an active SkySend workspace role."
            : "SkySend keeps each workspace scoped to the right authenticated role. The current account cannot open this area."
        }
      />

      <SectionCard
        eyebrow={missingRole ? "Role Required" : "Access Denied"}
        title={missingRole ? "Missing role context" : "Role mismatch"}
        description={
          missingRole
            ? "The account is authenticated, but access requires a valid client, admin or operator role."
            : "Authentication succeeded, but this workspace is not available with the current account role."
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/50 px-4 py-4 text-sm leading-6 text-muted-foreground">
            Required role:
            <strong className="ml-2 text-foreground">
              {requiredRole ? roleLabels[requiredRole] : "Protected workspace"}
            </strong>
          </div>
          <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/50 px-4 py-4 text-sm leading-6 text-muted-foreground">
            Current role:
            <strong className="ml-2 text-foreground">
              {currentRole ? roleLabels[currentRole] : "No resolved role"}
            </strong>
          </div>
        </div>

        <div className="rounded-[var(--ui-radius-card)] border border-border/80 bg-card px-4 py-4 text-sm leading-6 text-muted-foreground">
          {missingRole
            ? "If this account should access SkySend, assign one valid workspace role."
            : "If this account should access this area, update the workspace role and try again."}
        </div>

        <div className="flex flex-wrap gap-3">
          {currentRole ? (
            <AppButton asChild>
              <Link href={roleHomePaths[currentRole]}>
                <ShieldAlert className="size-4" />
                Open {roleLabels[currentRole]} Workspace
              </Link>
            </AppButton>
          ) : null}
          <AppButton asChild variant="outline">
            <Link href="/">Back to SkySend</Link>
          </AppButton>
        </div>
      </SectionCard>
    </div>
  );
}
