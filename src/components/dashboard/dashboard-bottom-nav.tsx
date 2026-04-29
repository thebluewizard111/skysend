"use client";

import Link from "next/link";
import { getDashboardMobileNavigation } from "@/constants/navigation";
import { useCurrentRoute } from "@/hooks/use-current-route";
import type { DashboardRole } from "@/types/roles";

export function DashboardBottomNav({ role }: { role: DashboardRole }) {
  const currentRoute = useCurrentRoute();
  const items = getDashboardMobileNavigation(role);

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={`${role} mobile navigation`}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/98 lg:hidden"
    >
      <div
        className="grid px-2 py-2"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const itemBasePath = item.href.split("#")[0];
          const isActive =
            currentRoute === item.href ||
            (item.href.endsWith("#overview") &&
              currentRoute === itemBasePath) ||
            (itemBasePath !== "/client" && currentRoute.startsWith(`${itemBasePath}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-center"
            >
              <span
                className={
                  isActive
                    ? "flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground"
                    : "flex size-9 items-center justify-center rounded-2xl bg-secondary text-foreground"
                }
              >
                <Icon className="size-4" />
              </span>
              <span className="text-[0.72rem] font-medium text-muted-foreground">
                {item.shortLabel ?? item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
