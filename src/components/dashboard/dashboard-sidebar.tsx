"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getDashboardNavigation } from "@/constants/navigation";
import { roleConfigs } from "@/constants/roles";
import { useCurrentRoute } from "@/hooks/use-current-route";
import type { DashboardNavItem } from "@/types/navigation";
import type { DashboardRole } from "@/types/roles";
import { BrandMark } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

function SidebarGroup({
  title,
  items,
  currentRoute,
}: {
  title: string;
  items: readonly DashboardNavItem[];
  currentRoute: string;
}) {
  return (
    <section className="space-y-2" aria-labelledby={`sidebar-group-${title.toLowerCase()}`}>
      <p id={`sidebar-group-${title.toLowerCase()}`} className="type-caption">
        {title}
      </p>
      <nav className="grid gap-2" aria-label={title}>
        {items.map((item) => {
          const Icon = item.icon;
          const itemBasePath = item.href.split("#")[0];
          const isOverviewRoot =
            item.href.endsWith("#overview") &&
            currentRoute === item.href.split("#")[0];
          const isNestedActive =
            itemBasePath !== "/client" &&
            itemBasePath !== "/admin" &&
            itemBasePath !== "/operator" &&
            currentRoute.startsWith(`${itemBasePath}/`);
          const isActive =
            currentRoute === item.href ||
            isOverviewRoot ||
            (itemBasePath === currentRoute && !item.href.includes("#")) ||
            isNestedActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "rounded-[calc(var(--radius)+0.375rem)] border px-4 py-3 transition-colors",
                isActive
                  ? "border-border bg-card shadow-[var(--elevation-card)]"
                  : "border-transparent text-muted-foreground hover:border-border/80 hover:bg-secondary hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-xl bg-secondary text-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="block">
                  <span className="block text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <small className="mt-1 block text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </small>
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

export function DashboardSidebar({ role }: { role: DashboardRole }) {
  const config = roleConfigs[role];
  const navigation = getDashboardNavigation(role);
  const currentRoute = useCurrentRoute();

  return (
    <aside className="hidden border-r border-border/80 bg-sidebar lg:block">
      <div className="sticky top-0 flex min-h-screen flex-col gap-8 px-5 py-8">
        <BrandMark compact />

        <div className="space-y-4">
          <Badge variant="outline">Role Workspace</Badge>
          <div className="space-y-2">
            <h2 className="font-heading text-2xl tracking-tight">
              {config.label}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Role-specific navigation for live operational workflows, billing
              visibility and service monitoring.
            </p>
          </div>
        </div>

        <SidebarGroup
          title="Primary"
          items={navigation.primary}
          currentRoute={currentRoute}
        />

        <SidebarGroup
          title="Secondary"
          items={navigation.secondary}
          currentRoute={currentRoute}
        />

        <div className="mt-auto space-y-2">
          <p className="type-caption">Workspaces</p>
          <nav className="grid gap-2">
            {navigation.workspaces.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-[calc(var(--radius)+0.25rem)] px-3 py-3 transition-colors",
                    isActive
                      ? "bg-card text-foreground shadow-[var(--elevation-card)]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-4" />
                    <span className="text-sm">{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}
