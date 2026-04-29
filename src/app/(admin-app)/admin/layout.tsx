import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRoleRoute } from "@/lib/protected-routes";

export default async function AdminAppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireRoleRoute("admin");

  return <DashboardShell role="admin">{children}</DashboardShell>;
}
