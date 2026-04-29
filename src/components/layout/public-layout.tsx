import type { ReactNode } from "react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicNavbar } from "@/components/layout/public-navbar";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell flex flex-col">
      <PublicNavbar />
      <main id="main-content" className="flex-1">
        <div className="app-container app-page-spacing app-section-stack">
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
