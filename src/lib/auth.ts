import {
  roleBindingStrategy,
  roleHomePaths,
  roleRoutingPaths,
  userRoles,
} from "@/constants/roles";
import type {
  ClerkRoleMetadata,
  RoleResolution,
  RoleResolutionInput,
  UserRole,
} from "@/types/roles";

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}

export function getRoleFromClerkMetadata(
  metadata: ClerkRoleMetadata | null | undefined,
) {
  return isUserRole(metadata?.role) ? metadata.role : null;
}

export function isDevelopmentRoleFallbackEnabled() {
  return process.env.NODE_ENV !== "production";
}

export function getDevelopmentRoleFallback() {
  return isDevelopmentRoleFallbackEnabled()
    ? roleBindingStrategy.developmentFallbackRole
    : null;
}

export function hasRole(currentRole: UserRole | null | undefined, role: UserRole) {
  return currentRole === role;
}

export function hasAnyRole(
  currentRole: UserRole | null | undefined,
  roles: readonly UserRole[],
) {
  return Boolean(currentRole && roles.includes(currentRole));
}

export function getRoleHomePath(role: UserRole) {
  return roleHomePaths[role];
}

export function getInvalidRoleRedirectPath(reason: "invalid-role" | "no-role" = "invalid-role") {
  return reason === "no-role" ? roleRoutingPaths.noRole : roleRoutingPaths.invalidRole;
}

export function getPostAuthRedirectPath(role: UserRole | null | undefined) {
  if (!role) {
    return getInvalidRoleRedirectPath("no-role");
  }

  return getRoleHomePath(role);
}

export function canAccessRoleRoute(
  currentRole: UserRole | null | undefined,
  targetRole: UserRole,
) {
  return currentRole === targetRole;
}

export function resolveUserRole({
  clerkRole,
  databaseRole,
  fallbackRole = roleBindingStrategy.fallbackRole,
}: RoleResolutionInput): RoleResolution {
  const effectiveFallbackRole =
    fallbackRole ?? getDevelopmentRoleFallback();

  if (databaseRole && clerkRole) {
    return {
      role: databaseRole,
      source: "database",
      isMismatch: databaseRole !== clerkRole,
      shouldSyncClerkMetadata: databaseRole !== clerkRole,
      shouldPersistToDatabase: false,
    };
  }

  if (databaseRole) {
    return {
      role: databaseRole,
      source: "database",
      isMismatch: false,
      shouldSyncClerkMetadata: true,
      shouldPersistToDatabase: false,
    };
  }

  if (clerkRole) {
    return {
      role: clerkRole,
      source: "clerk_metadata",
      isMismatch: false,
      shouldSyncClerkMetadata: false,
      shouldPersistToDatabase: true,
    };
  }

  return {
    role: effectiveFallbackRole,
    source: effectiveFallbackRole ? "fallback" : null,
    isMismatch: false,
    shouldSyncClerkMetadata: Boolean(effectiveFallbackRole),
    shouldPersistToDatabase: Boolean(effectiveFallbackRole),
  };
}

export function getRequiredRoleForPath(pathname: string) {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return isUserRole(firstSegment) ? firstSegment : null;
}
