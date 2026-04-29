import {
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  Package2,
  Radar,
  Route,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  Warehouse,
  Wrench,
} from "lucide-react";
import { roleHomePaths } from "@/constants/roles";
import type { RoleNavigation } from "@/types/navigation";
import type { DashboardRole } from "@/types/roles";

const workspaceItems = {
  client: {
    label: "Client Workspace",
    href: roleHomePaths.client,
    description: "Requests, tracking, and service visibility.",
    icon: UserRound,
  },
  admin: {
    label: "Admin Workspace",
    href: roleHomePaths.admin,
    description: "Commercial controls and network oversight.",
    icon: ShieldCheck,
  },
  operator: {
    label: "Operator Workspace",
    href: roleHomePaths.operator,
    description: "Mission flow, pads, and drone readiness.",
    icon: Wrench,
  },
} as const;

export const clientDashboardNavigation = {
  primary: [
    {
      label: "Overview",
      shortLabel: "Overview",
      href: "/client#overview",
      description: "Account snapshot, delivery pulse, and service state.",
      icon: LayoutDashboard,
    },
    {
      label: "Deliveries",
      shortLabel: "Deliveries",
      href: "/client/orders",
      description: "Requests, live parcel tracking, and upcoming windows.",
      icon: Package2,
    },
    {
      label: "Billing",
      shortLabel: "Billing",
      href: "/client/billing-history",
      description: "Payment history, receipts, and saved cards.",
      icon: CreditCard,
    },
  ],
  secondary: [
    {
      label: "Failed Orders",
      shortLabel: "Failed",
      href: "/client/orders/failed",
      description: "Transparent review of blocked or failed deliveries.",
      icon: TriangleAlert,
    },
    {
      label: "Support",
      shortLabel: "Support",
      href: "/client#support",
      description: "Exceptions, contact paths, and account help.",
      icon: CircleHelp,
    },
  ],
  workspaces: [
    workspaceItems.client,
    workspaceItems.admin,
    workspaceItems.operator,
  ],
  mobile: [
    {
      label: "Overview",
      shortLabel: "Home",
      href: "/client#overview",
      description: "Client overview and status.",
      icon: LayoutDashboard,
    },
    {
      label: "Deliveries",
      shortLabel: "Orders",
      href: "/client/orders",
      description: "Requests and parcel tracking.",
      icon: Package2,
    },
    {
      label: "Billing",
      shortLabel: "Billing",
      href: "/client/billing-history",
      description: "Payment history.",
      icon: CreditCard,
    },
    {
      label: "Failed",
      shortLabel: "Failed",
      href: "/client/orders/failed",
      description: "Failed deliveries and next actions.",
      icon: TriangleAlert,
    },
    {
      label: "Support",
      shortLabel: "Help",
      href: "/client#support",
      description: "Support and account help.",
      icon: CircleHelp,
    },
  ],
} as const;

export const adminDashboardNavigation = {
  primary: [
    {
      label: "Overview",
      href: "/admin#overview",
      description: "Platform health, live incidents, and attention queue.",
      icon: LayoutDashboard,
    },
    {
      label: "Orders",
      href: "/admin/orders",
      description: "Active orders and failed delivery context.",
      icon: Package2,
    },
    {
      label: "Fleet",
      href: "/admin/fleet",
      description: "Drone class readiness and operating envelope.",
      icon: Wrench,
    },
  ],
  secondary: [
    {
      label: "Manual Review",
      href: "/admin/manual-review",
      description: "Human decisions for address, safety, parcel, and payment issues.",
      icon: ShieldCheck,
    },
    {
      label: "Coverage",
      href: "/admin#network",
      description: "Pitesti coverage status and service eligibility.",
      icon: Radar,
    },
  ],
  workspaces: [
    workspaceItems.admin,
    workspaceItems.client,
    workspaceItems.operator,
  ],
} as const;

export const operatorDashboardNavigation = {
  primary: [
    {
      label: "Overview",
      href: "/operator#overview",
      description: "Mission pulse, readiness, and live flight density.",
      icon: LayoutDashboard,
    },
    {
      label: "Missions",
      href: "/operator#missions",
      description: "Dispatch queues, route exceptions, and mission load.",
      icon: Route,
    },
    {
      label: "Pads",
      href: "/operator#pads",
      description: "Pad readiness, turnaround quality, and station status.",
      icon: Warehouse,
    },
  ],
  secondary: [
    {
      label: "Alerts",
      href: "/operator#alerts",
      description: "Weather, incident flow, and operator escalations.",
      icon: TriangleAlert,
    },
  ],
  workspaces: [
    workspaceItems.operator,
    workspaceItems.client,
    workspaceItems.admin,
  ],
} as const;

export const dashboardNavigation: RoleNavigation = {
  client: clientDashboardNavigation,
  admin: adminDashboardNavigation,
  operator: operatorDashboardNavigation,
};

export function getDashboardNavigation(role: DashboardRole) {
  return dashboardNavigation[role];
}

export function getDashboardMobileNavigation(role: DashboardRole) {
  return dashboardNavigation[role].mobile ?? [];
}
