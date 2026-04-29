import { cn } from "@/lib/utils";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-2xl border border-border/80 bg-card shadow-[var(--elevation-card)]"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="7" y="7" width="14" height="14" rx="4" fill="#102033" />
          <path
            d="M4 9H8M20 9H24M4 19H8M20 19H24M14 4V8M14 20V24"
            stroke="#0F9BD7"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M11 13.25H17M11 16.75H15"
            stroke="#F4B35E"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <span className={cn("grid gap-0.5", compact && "gap-0")}>
        <span className="font-heading text-base font-semibold tracking-tight">
          SkySend
        </span>
        {!compact ? (
          <span className="text-sm text-muted-foreground">
            Premium urban drone logistics
          </span>
        ) : null}
      </span>
    </div>
  );
}
