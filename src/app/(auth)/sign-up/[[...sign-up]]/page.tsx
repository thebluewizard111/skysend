import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { AlertTriangle, MapPinned } from "lucide-react";
import { AppButton } from "@/components/shared/app-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { roleRoutingPaths } from "@/constants/roles";
import { isClerkFrontendConfigured } from "@/lib/clerk-config";
import { clerkAppearance } from "@/lib/clerk-theme";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Sign Up",
  "Create a SkySend workspace account with Clerk-powered authentication.",
);

const clerkEnabled = isClerkFrontendConfigured();

export default function SignUpPage() {
  if (!clerkEnabled) {
    return (
      <div className="grid gap-5">
        <div className="space-y-3">
          <Badge variant="outline">Sign Up</Badge>
          <h1 className="type-h2">Account creation is prepared, but Clerk is not configured locally.</h1>
          <p className="type-subtitle">
            The product surface is ready for sign-up, but local auth still needs
            real Clerk environment values before registration can be enabled.
          </p>
        </div>

        <EmptyState
          title="Authentication is not configured yet"
          description="Add real Clerk local values to enable account creation."
          icon={<AlertTriangle className="size-6" />}
          primaryAction={{ label: "Back to Home", href: "/" }}
          secondaryAction={{ label: "Contact", href: "/contact" }}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="space-y-4">
        <Badge variant="outline" className="w-fit">
          Sign Up
        </Badge>
        <div className="space-y-3">
          <h1 className="type-h2">Create your SkySend account.</h1>
          <p className="type-subtitle">
            Set up access to the live product surface and keep the same clean
            sign-up path whether the account will enter the client, admin or
            operator workspace.
          </p>
        </div>
      </div>

      <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
        <CardContent className="grid gap-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 px-4 py-3">
            <MapPinned className="size-4 text-foreground" />
            <p className="text-sm leading-7 text-muted-foreground">
              SkySend is currently available in the active Pitesti delivery zone.
            </p>
          </div>

          <div className="flex justify-center">
            <SignUp
              appearance={clerkAppearance}
              path="/sign-up"
              routing="path"
              forceRedirectUrl={roleRoutingPaths.authContinue}
              signInUrl="/sign-in"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Already have access? Use the sign-in flow instead.
        </p>
        <AppButton asChild variant="ghost" size="sm">
          <Link href="/sign-in">Sign in</Link>
        </AppButton>
      </div>
    </div>
  );
}
