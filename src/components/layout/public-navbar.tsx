"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ClerkAuthControls } from "@/components/auth/clerk-auth-controls";
import { publicNavigation } from "@/constants/public-navigation";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/96">
      <div className="app-container">
        <div className="flex min-h-18 items-center justify-between gap-6 py-4">
          <Link href="/" aria-label="SkySend home">
            <BrandMark compact />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 lg:flex"
          >
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <ClerkAuthControls />
            <Button asChild variant="outline" size="sm">
              <Link href="/client/create-delivery">Create delivery</Link>
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            aria-expanded={isOpen}
            aria-controls="public-mobile-nav"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setIsOpen((open) => !open)}
          >
            {isOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div
          id="public-mobile-nav"
          className="border-t border-border/80 bg-background lg:hidden"
        >
          <div className="app-container flex flex-col gap-3 py-4">
            <nav aria-label="Mobile primary" className="grid gap-1">
              {publicNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "rounded-[calc(var(--radius)+0.25rem)] px-3 py-3 text-sm text-foreground transition-colors",
                    pathname === item.href
                      ? "bg-secondary"
                      : "hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-2 pt-2">
              <ClerkAuthControls mobile onAction={() => setIsOpen(false)} />
              <Button asChild variant="outline" className="justify-center">
                <Link href="/client/create-delivery" onClick={() => setIsOpen(false)}>
                  Create delivery
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
