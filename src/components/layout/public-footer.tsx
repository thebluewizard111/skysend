import Link from "next/link";
import { publicNavigation } from "@/constants/public-navigation";
import { siteConfig } from "@/constants/site";
import { BrandMark } from "@/components/shared/brand-mark";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/80">
      <div className="app-container py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.95fr)]">
          <div className="space-y-4">
            <Link href="/" aria-label="SkySend home">
              <BrandMark />
            </Link>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              SkySend operates a focused drone delivery surface for Pitesti, with
              clear coverage, tracking and operational handoff flows.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-3">
              <p className="type-caption">Navigation</p>
              <nav aria-label="Footer navigation" className="grid gap-2">
                {publicNavigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="space-y-3">
              <p className="type-caption">Contact</p>
              <address className="grid gap-2 not-italic">
                <a
                  href={`mailto:${siteConfig.supportEmail}`}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {siteConfig.supportEmail}
                </a>
                <Link
                  href="/sign-in"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="/client/create-delivery"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Create delivery
                </Link>
              </address>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border/80 pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright 2026 {siteConfig.name}. Live drone delivery in Pitesti.</p>
          <p>Built for calm operations, clear routing and verified handoffs.</p>
        </div>
      </div>
    </footer>
  );
}
