"use client";

import type { ChangeEvent } from "react";
import { Funnel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { FilterBarItem } from "@/types/ui";

type FilterBarProps = {
  filters: FilterBarItem[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
};

export function FilterBar({
  filters,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
}: FilterBarProps) {
  return (
    <section
      aria-label="Filters"
      className="rounded-[var(--ui-radius-card)] border border-border/80 bg-card p-4 shadow-[var(--elevation-card)]"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-2">
            <Funnel className="size-3.5" />
            Filters
          </Badge>
        </div>

        <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1.2fr)_repeat(3,minmax(11rem,1fr))]">
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />

          {filters.map((filter) => (
            <label key={filter.id} className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {filter.label}
              </span>
              <select
                value={filter.value}
                aria-label={filter.label}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  filter.onChange?.(event.target.value)
                }
                className="h-12 rounded-2xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] focus-visible:border-primary/15 focus-visible:ring-4 focus-visible:ring-ring"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
