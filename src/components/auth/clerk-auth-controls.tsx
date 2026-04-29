"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { roleRoutingPaths } from "@/constants/roles";
import { isClerkFrontendConfigured } from "@/lib/clerk-config";
import { Button } from "@/components/ui/button";

type ClerkAuthControlsProps = {
  mobile?: boolean;
  onAction?: () => void;
};

const clerkEnabled = isClerkFrontendConfigured();

export function ClerkAuthControls({
  mobile = false,
  onAction,
}: ClerkAuthControlsProps) {
  if (!clerkEnabled) {
    return null;
  }

  return (
    <>
      <Show when="signed-out">
        <div className={mobile ? "flex flex-col gap-2" : "flex items-center gap-2"}>
          <SignInButton mode="redirect" forceRedirectUrl={roleRoutingPaths.authContinue}>
            <Button
              variant="ghost"
              size={mobile ? "default" : "sm"}
              className={mobile ? "justify-center" : undefined}
              onClick={onAction}
            >
              Sign In
            </Button>
          </SignInButton>

          <SignUpButton mode="redirect" forceRedirectUrl={roleRoutingPaths.authContinue}>
            <Button
              variant="outline"
              size={mobile ? "default" : "sm"}
              className={mobile ? "justify-center" : undefined}
              onClick={onAction}
            >
              Sign Up
            </Button>
          </SignUpButton>
        </div>
      </Show>

      <Show when="signed-in">
        <div className={mobile ? "flex justify-center" : "flex items-center"}>
          <UserButton
            showName={!mobile}
            afterSwitchSessionUrl={roleRoutingPaths.authContinue}
          />
        </div>
      </Show>
    </>
  );
}
