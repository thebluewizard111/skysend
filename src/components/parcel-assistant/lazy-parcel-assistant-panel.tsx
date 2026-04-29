"use client";

import dynamic from "next/dynamic";
import type { ParcelAssistantPanelProps } from "@/components/parcel-assistant/parcel-assistant-panel";

export const LazyParcelAssistantPanel = dynamic<ParcelAssistantPanelProps>(
  () =>
    import("@/components/parcel-assistant/parcel-assistant-panel").then(
      (module) => module.ParcelAssistantPanel,
    ),
  {
    ssr: false,
  },
);
