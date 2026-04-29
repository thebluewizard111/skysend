import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRoleRoute } from "@/lib/protected-routes";

export default async function OperatorAppLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireRoleRoute("operator");

  return <DashboardShell role="operator">{children}</DashboardShell>;
}
