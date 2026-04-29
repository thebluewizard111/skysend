import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import {
  getPostAuthRedirectPath,
  getRoleFromClerkMetadata,
  resolveUserRole,
} from "@/lib/auth";
import type { ClerkRoleMetadata } from "@/types/roles";

export async function resolveRoleRedirectPath() {
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

  return getPostAuthRedirectPath(resolution.role);
}
