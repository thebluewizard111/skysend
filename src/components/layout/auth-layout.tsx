import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, MapPinned, Radar, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const authSignals = [
  {
    title: "Create and track deliveries",
    body: "Open the live Pitesti order flow, follow active deliveries and keep route state visible from request to handoff.",
    icon: Radar,
  },
  {
    title: "Current service area",
    body: "SkySend is available now inside the active Pitesti zone, with coverage kept explicit from the first screen.",
    icon: MapPinned,
  },
  {
    title: "Protected workspaces",
    body: "Client, admin and operator surfaces share one authentication layer so the product stays consistent across roles.",
    icon: ShieldCheck,
  },
] as const;

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell bg-background">
      <div className="app-container app-page-spacing flex min-h-screen flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="SkySend home">
            <BrandMark compact />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Back to site
          </Link>
        </div>

        <main
          id="main-content"
          className="flex flex-1 items-center py-2 md:py-4"
        >
          <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,30rem)] xl:items-center">
            <section className="grid gap-6">
              <div className="max-w-2xl space-y-4">
                <Badge variant="outline" className="w-fit">
                  Service active in Pitesti
                </Badge>
                <div className="space-y-3">
                  <h1 className="type-h1">
                    Authentication that feels native to the product.
                  </h1>
                  <p className="type-subtitle max-w-xl">
                    Sign in or create an account to enter the SkySend delivery
                    flow, with the same calm structure used across coverage,
                    pricing and live tracking surfaces.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
                {authSignals.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Card key={item.title} size="sm">
                      <CardContent className="grid gap-4">
                        <span className="flex size-11 items-center justify-center rounded-2xl border border-border/80 bg-secondary/45 text-foreground">
                          <Icon className="size-5" />
                        </span>
                        <div className="space-y-2">
                          <h2 className="font-heading text-lg tracking-tight">
                            {item.title}
                          </h2>
                          <p className="text-sm leading-7 text-muted-foreground">
                            {item.body}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            <section className="w-full xl:justify-self-end">
              <div className="w-full max-w-[30rem]">{children}</div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
