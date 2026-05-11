import type { Viewport } from "./types";

export type ViewportPreset = {
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
  description: string;
};

export const viewportPresets: Record<Viewport, ViewportPreset> = {
  desktop: {
    label: "Desktop",
    width: 1280,
    height: 720,
    aspectRatio: "16 / 9",
    description: "1280 \u00d7 720",
  },
  tablet: {
    label: "Tablet",
    width: 768,
    height: 1024,
    aspectRatio: "3 / 4",
    description: "768 \u00d7 1024",
  },
  mobile: {
    label: "Mobile",
    width: 390,
    height: 844,
    aspectRatio: "390 / 844",
    description: "390 \u00d7 844",
  },
};
