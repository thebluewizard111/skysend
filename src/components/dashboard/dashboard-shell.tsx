"use client";

import type { ReactNode } from "react";
import { DashboardBottomNav } from "@/components/dashboard/dashboard-bottom-nav";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { useActiveRole } from "@/hooks/use-active-role";
import type { DashboardRole } from "@/types/roles";

export function DashboardShell({
  children,
  role,
}: {
  children: ReactNode;
  role?: DashboardRole;
}) {
  const detectedRole = useActiveRole();
  const activeRole = role ?? detectedRole ?? "client";
  const isClientWorkspace = activeRole === "client";

  return (
    <div className="app-shell">
      <div className="grid min-h-screen lg:grid-cols-[18rem_minmax(0,1fr)]">
        <DashboardSidebar role={activeRole} />

        <div className={isClientWorkspace ? "pb-24 lg:pb-0" : undefined}>
          <main id="main-content" className="app-page-spacing">
            <DashboardTopbar role={activeRole} />
            <div className="pt-8">{children}</div>
          </main>
        </div>
      </div>

      {isClientWorkspace ? <DashboardBottomNav role={activeRole} /> : null}
    </div>
  );
}
