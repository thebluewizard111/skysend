import Link from "next/link";
import { ChevronLeft, PanelTop } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { roleConfigs } from "@/constants/roles";
import type { DashboardRole } from "@/types/roles";

export function DashboardTopbar({ role }: { role: DashboardRole }) {
  const config = roleConfigs[role];

  return (
    <header className="app-container flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3">
        <Badge variant="outline" className="w-fit">
          <PanelTop className="size-3.5" />
          Authenticated Workspace
        </Badge>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
            {config.title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Built for {config.label.toLowerCase()} workflows on desktop and
            mobile, with role-specific sections for daily operations.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ChevronLeft />
            Back to SkySend
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={config.basePath}>Refresh Workspace</Link>
        </Button>
      </div>
    </header>
  );
}
