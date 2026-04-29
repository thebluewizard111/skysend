"use client";

import { usePathname } from "next/navigation";
import type { DashboardRole } from "@/types/roles";
import { isUserRole } from "@/lib/auth";

export function useActiveRole(): DashboardRole | null {
  const pathname = usePathname();
  const activeSegment = pathname.split("/").filter(Boolean)[0];

  return isUserRole(activeSegment) ? activeSegment : null;
}
