import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isClerkConfigured } from "@/lib/clerk-config";
import {
  canAccessRoleRoute,
  getInvalidRoleRedirectPath,
  getPostAuthRedirectPath,
  getRoleFromClerkMetadata,
  resolveUserRole,
} from "@/lib/auth";
import type { ClerkRoleMetadata, UserRole } from "@/types/roles";

type UnauthorizedBehavior = "redirect_home" | "access_denied";

export type ProtectedRouteContext = {
  userId: string;
  role: UserRole | null;
  roleSource: "database" | "clerk_metadata" | "fallback" | null;
  isRoleMismatch: boolean;
};

function createAccessDeniedUrl(expectedRole: UserRole, currentRole?: UserRole | null) {
  const params = new URLSearchParams({ required: expectedRole });

  if (currentRole) {
    params.set("current", currentRole);
  }

  return `/access-denied?${params.toString()}`;
}

async function getAuthenticatedRoleContext(): Promise<ProtectedRouteContext> {
  if (!isClerkConfigured()) {
    redirect("/sign-in?auth=not-configured");
  }

  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const user = await currentUser();
  const clerkRole = getRoleFromClerkMetadata(
    (user?.publicMetadata ?? null) as ClerkRoleMetadata | null,
  );
  const resolution = resolveUserRole({
    clerkRole,
    fallbackRole: null,
  });

  return {
    userId,
    role: resolution.role,
    roleSource: resolution.source,
    isRoleMismatch: resolution.isMismatch,
  };
}

export async function requireAuthenticatedRoute() {
  return getAuthenticatedRoleContext();
}

export async function requireRoleRoute(
  expectedRole: UserRole,
  behavior: UnauthorizedBehavior = "redirect_home",
) {
  const context = await getAuthenticatedRoleContext();

  if (context.role && canAccessRoleRoute(context.role, expectedRole)) {
    return context;
  }

  if (behavior === "redirect_home" && context.role) {
    redirect(getPostAuthRedirectPath(context.role));
  }

  if (!context.role) {
    redirect(getInvalidRoleRedirectPath("no-role"));
  }

  redirect(createAccessDeniedUrl(expectedRole, context.role));
}
