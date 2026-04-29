import { SignIn } from "@clerk/nextjs";
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
  "Sign In",
  "Secure access to SkySend workspaces for client, admin, and operator teams.",
);

const clerkEnabled = isClerkFrontendConfigured();

export default function SignInPage() {
  if (!clerkEnabled) {
    return (
      <div className="grid gap-5">
        <div className="space-y-3">
          <Badge variant="outline">Sign In</Badge>
          <h1 className="type-h2">Sign in is ready, but Clerk is not configured locally.</h1>
          <p className="type-subtitle">
            SkySend can run without Clerk during local UI work, but authentication
            needs real Clerk keys in <code>.env.local</code> before this form can
            go live.
          </p>
        </div>

        <EmptyState
          title="Authentication is not configured yet"
          description="Add a real Clerk publishable key and secret key to enable the sign-in flow."
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
          Sign In
        </Badge>
        <div className="space-y-3">
          <h1 className="type-h2">Open your SkySend workspace.</h1>
          <p className="type-subtitle">
            Sign in to create deliveries, track active orders and access the
            client, admin or operator surface connected to your account.
          </p>
        </div>
      </div>

      <Card className="rounded-[var(--ui-radius-panel)] shadow-[var(--elevation-panel)]">
        <CardContent className="grid gap-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 rounded-[calc(var(--radius)+0.375rem)] border border-border/80 bg-secondary/45 px-4 py-3">
            <MapPinned className="size-4 text-foreground" />
            <p className="text-sm leading-7 text-muted-foreground">
              Service is currently active inside the Pitesti coverage area.
            </p>
          </div>

          <div className="flex justify-center">
            <SignIn
              appearance={clerkAppearance}
              path="/sign-in"
              routing="path"
              forceRedirectUrl={roleRoutingPaths.authContinue}
              signUpUrl="/sign-up"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          New to SkySend? Create an account to access the product flow.
        </p>
        <AppButton asChild variant="ghost" size="sm">
          <Link href="/sign-up">Create account</Link>
        </AppButton>
      </div>
    </div>
  );
}
