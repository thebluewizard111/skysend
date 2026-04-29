"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { LoaderCircle, PackagePlus, Sparkles, X } from "lucide-react";
import { droneClassLabels } from "@/constants/domain";
import {
  parcelPackagingOptions,
  parcelSizeOptions,
} from "@/constants/parcel-assistant";
import {
  getParcelAssistantMockResult,
  parcelFragileLevelLabels,
} from "@/lib/parcel-assistant";
import type { ParcelAssistantInput } from "@/types/parcel-assistant";
import type { ParcelAssistantResult } from "@/types/parcel-assistant";
import type {
  ParcelEstimatorErrorResponse,
  ParcelEstimatorResponse,
} from "@/types/parcel-estimator";
import { AppButton } from "@/components/shared/app-button";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const initialState: ParcelAssistantInput = {
  contents: "",
  packaging: "boxed",
  approximateSize: "small",
};

export type ParcelAssistantPanelProps = {
  open: boolean;
  onClose: () => void;
  initialInput?: ParcelAssistantInput;
  onApply?: (
    input: ParcelAssistantInput,
    result: ParcelAssistantResult,
  ) => void;
};

export function ParcelAssistantPanel({
  open,
  onClose,
  initialInput,
  onApply,
}: ParcelAssistantPanelProps) {
  const titleId = useId();
  const [formState, setFormState] = useState<ParcelAssistantInput>(
    initialInput ?? initialState,
  );
  const [estimate, setEstimate] = useState<ParcelEstimatorResponse | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const localResult = useMemo(() => {
    return getParcelAssistantMockResult(formState);
  }, [formState]);
  const estimateSourceLabel =
    estimate?.source === "ai_assisted"
      ? "AI-assisted"
      : estimate?.source === "local_fallback"
        ? "Local fallback"
        : "Local baseline";
  const estimateSourceTone =
    estimate?.source === "ai_assisted"
      ? ("success" as const)
      : estimate?.source === "local_fallback"
        ? ("warning" as const)
        : ("info" as const);
  const weightLabel = estimate
    ? `${estimate.estimatedWeightMin} - ${estimate.estimatedWeightMax} kg`
    : localResult.estimatedWeightRange;
  const fragileLevel = estimate?.fragileLevel ?? localResult.fragileLevel;
  const recommendedDroneClass =
    estimate?.recommendedDroneClass ?? localResult.suggestedDroneClass;
  const explanation =
    estimate?.explanation ??
    `${localResult.confidenceNote} Run the server estimator for AI-assisted material and item detection.`;
  const appliedResult: ParcelAssistantResult = {
    estimatedWeightRange: weightLabel,
    fragileLevel,
    suggestedDroneClass: recommendedDroneClass,
    confidenceNote: explanation,
  };

  function updateFormState(nextState: ParcelAssistantInput) {
    setFormState(nextState);
    setEstimate(null);
    setEstimateError(null);
  }

  async function handleEstimateParcel() {
    setIsEstimating(true);
    setEstimateError(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch("/api/parcel-estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          contentDescription: formState.contents,
          packaging: formState.packaging,
          approximateSize: formState.approximateSize,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json()) as ParcelEstimatorErrorResponse;
        throw new Error(errorBody.error || "Parcel estimate failed.");
      }

      const payload = (await response.json()) as ParcelEstimatorResponse;
      setEstimate(payload);
    } catch (error) {
      setEstimate(null);
      setEstimateError(
        error instanceof DOMException && error.name === "AbortError"
          ? "Parcel estimate took too long."
          : error instanceof Error
          ? error.message
          : "Parcel estimate could not be refreshed.",
      );
    } finally {
      window.clearTimeout(timeout);
      setIsEstimating(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close Parcel Assistant"
        className="absolute inset-0 bg-[rgba(15,23,38,0.32)]"
        onClick={onClose}
      />

      <aside className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[1.5rem] border border-border/80 bg-background shadow-[var(--elevation-panel)] md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[32rem] md:rounded-none md:rounded-l-[1.5rem]">
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-border md:hidden" />

        <div className="flex items-start justify-between gap-4 border-b border-border/80 px-5 py-4 md:px-6">
          <div className="space-y-3">
            <Badge variant="outline" className="w-fit">
              Parcel Assistant
            </Badge>
            <div className="space-y-2">
              <h2 id={titleId} className="type-h3">
                Package guidance for order creation
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Structured input beats a vague guess. This module estimates parcel
                profile and suggests a suitable fleet class before dispatch.
              </p>
            </div>
          </div>

          <AppButton
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Close Parcel Assistant"
            onClick={onClose}
          >
            <X />
          </AppButton>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto px-5 py-5 md:px-6">
          <SectionCard
            eyebrow="Parcel Input"
            title="Describe the parcel"
            description="Keep the input simple and operational. The server estimator can add AI-assisted item detection while the local baseline keeps the flow available."
          >
            <label className="grid gap-2">
              <span className="text-sm font-medium">Package contents</span>
              <textarea
                value={formState.contents}
                placeholder="Example: pharmacy refill, delicate device accessories, same-hour office parcel"
                className="min-h-28 rounded-[var(--ui-radius-card)] border border-input bg-card px-4 py-3 text-sm leading-6 outline-none transition-[border-color,box-shadow] focus-visible:border-primary/15 focus-visible:ring-4 focus-visible:ring-ring"
                onChange={(event) =>
                  updateFormState({
                    ...formState,
                    contents: event.target.value,
                  })
                }
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium">Packaging</span>
                <select
                  value={formState.packaging}
                  className="h-12 rounded-2xl border border-input bg-card px-4 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary/15 focus-visible:ring-4 focus-visible:ring-ring"
                  onChange={(event) =>
                    updateFormState({
                      ...formState,
                      packaging: event.target.value as ParcelAssistantInput["packaging"],
                    })
                  }
                >
                  {parcelPackagingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium">Approximate size</span>
                <select
                  value={formState.approximateSize}
                  className="h-12 rounded-2xl border border-input bg-card px-4 text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-primary/15 focus-visible:ring-4 focus-visible:ring-ring"
                  onChange={(event) =>
                    updateFormState({
                      ...formState,
                      approximateSize:
                        event.target.value as ParcelAssistantInput["approximateSize"],
                    })
                  }
                >
                  {parcelSizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                value={droneClassLabels[recommendedDroneClass]}
                readOnly
                aria-label="Suggested drone class"
              />
              <div className="flex flex-wrap gap-2">
                <AppButton
                  type="button"
                  variant="outline"
                  disabled={isEstimating}
                  onClick={() => updateFormState(initialState)}
                >
                  Reset
                </AppButton>
                <AppButton
                  type="button"
                  disabled={isEstimating}
                  onClick={handleEstimateParcel}
                >
                  {isEstimating ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  Estimate
                </AppButton>
              </div>
            </div>

            {estimateError ? (
              <div className="rounded-[calc(var(--radius)+0.375rem)] border border-warning/30 bg-warning/10 px-4 py-3 text-sm leading-6 text-muted-foreground">
                {estimateError} Local baseline remains available and can still be applied.
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            eyebrow="Fit Result"
            title="Dispatch guidance preview"
            description="The estimate is directional. It supports intake and drone fit, but does not promise exact weight."
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={estimateSourceLabel} tone={estimateSourceTone} />
              {estimate ? (
                <StatusBadge
                  label={`${Math.round(estimate.confidence * 100)}% confidence`}
                  tone="info"
                />
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/50 px-4 py-4">
                <p className="text-sm text-muted-foreground">Estimated weight range</p>
                <p className="mt-2 font-heading text-2xl tracking-tight">
                  {weightLabel}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {estimate?.safetyNote ?? "Final weight will be confirmed at pickup"}
                </p>
              </div>

              <div className="rounded-[calc(var(--radius)+0.25rem)] border border-border/80 bg-secondary/50 px-4 py-4">
                <p className="text-sm text-muted-foreground">Fragile level</p>
                <div className="mt-2">
                  <StatusBadge
                    label={parcelFragileLevelLabels[fragileLevel]}
                    tone={
                      fragileLevel === "high"
                        ? "warning"
                        : fragileLevel === "moderate"
                          ? "info"
                          : "success"
                    }
                  />
                </div>
              </div>
            </div>

            {estimate?.detectedItems.length ? (
              <div className="rounded-[var(--ui-radius-card)] border border-border/80 bg-secondary/35 px-4 py-4">
                <p className="text-sm text-muted-foreground">Detected items</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {estimate.detectedItems.map((item) => (
                    <StatusBadge key={item} label={item} tone="neutral" />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-[var(--ui-radius-card)] border border-border/80 bg-card px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Suggested drone class</p>
                  <p className="font-heading text-2xl tracking-tight">
                    {droneClassLabels[recommendedDroneClass]}
                  </p>
                </div>
                <span className="rounded-full bg-accent px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground">
                  Fit Check
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {explanation}
              </p>
            </div>
          </SectionCard>
        </div>

        <div className="border-t border-border/80 px-5 py-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4" />
              Designed for order creation, not as a global floating bot.
            </div>
            <AppButton
              type="button"
              onClick={() => {
                onApply?.(formState, appliedResult);
                onClose();
              }}
            >
              <PackagePlus />
              Use This Guidance
            </AppButton>
          </div>
        </div>
      </aside>
    </div>
  );
}
