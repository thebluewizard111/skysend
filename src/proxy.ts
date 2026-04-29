import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { guestOnlyRoutePatterns, protectedRoleRoutePatterns, roleRoutingPaths } from "@/constants/roles";
import { isClerkConfigured } from "@/lib/clerk-config";

const isProtectedRoute = createRouteMatcher([...protectedRoleRoutePatterns]);
const isGuestOnlyRoute = createRouteMatcher([...guestOnlyRoutePatterns]);
const clerkEnabled = isClerkConfigured();

const clerkProtectedMiddleware = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  if (isGuestOnlyRoute(req)) {
    const { userId } = await auth();

    if (userId) {
      return NextResponse.redirect(new URL(roleRoutingPaths.authContinue, req.url));
    }
  }
});

export default clerkEnabled
  ? clerkProtectedMiddleware
  : function proxy() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
