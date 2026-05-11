import type { CSSProperties } from "react";
import type { ElementNode, StyleConfig, Viewport } from "./types";

export const viewports: Viewport[] = ["desktop", "tablet", "mobile"];

export const displayOptions = ["block", "flex", "grid"] as const;
export const flexDirectionOptions = ["row", "column"] as const;
export const justifyOptions = ["start", "center", "end", "between", "around", "evenly"];
export const alignOptions = ["start", "center", "end", "stretch"];
export const positionOptions = ["static", "relative", "absolute", "fixed", "sticky"] as const;
export const widthOptions = ["auto", "full", "fit", "1/2", "1/3", "2/3"] as const;
export const paddingOptions = ["p-0", "p-2", "p-4", "p-5", "p-6", "p-8", "px-5 py-14 min-h-screen", "px-6 py-3", "px-8 py-4", "px-10 py-20 min-h-screen"];
export const marginOptions = ["m-0", "mx-auto", "mt-4", "mt-6", "mb-4", "my-8"];
export const gapOptions = ["gap-0", "gap-2", "gap-4", "gap-6", "gap-8", "gap-10", "gap-12", "gap-16"];
export const radiusOptions = ["rounded-none", "rounded-md", "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-full"];
export const fontSizeOptions = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-4xl", "text-5xl", "text-6xl"];
export const fontWeightOptions = ["font-normal", "font-medium", "font-semibold", "font-bold", "font-extrabold"];
export const backgroundOptions = [
  "bg-transparent",
  "bg-white",
  "bg-slate-950",
  "bg-slate-900",
  "bg-white/10",
  "bg-cyan-300",
  "bg-blue-600",
  "bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500",
];
export const textColorOptions = ["text-slate-950", "text-slate-700", "text-slate-300", "text-white", "text-cyan-300", "text-center text-white", "text-center text-slate-300"];
export const overflowOptions = ["visible", "hidden"] as const;
export const animationTypeOptions = ["none", "fade-in", "slide-up", "slide-left", "scale-in", "blur-in"] as const;
export const triggerOptions = ["page-load", "scroll-enter", "hover"] as const;
export const easeOptions = ["power2.out", "power3.out", "back.out", "ease-out"];

const displayClass: Record<NonNullable<StyleConfig["display"]>, string> = {
  block: "block",
  flex: "flex",
  grid: "grid grid-cols-2",
};

const flexDirectionClass: Record<NonNullable<StyleConfig["flexDirection"]>, string> = {
  row: "flex-row",
  column: "flex-col",
};

const justifyClass: Record<string, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

const alignClass: Record<string, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const positionClass: Record<NonNullable<StyleConfig["position"]>, string> = {
  static: "static",
  relative: "relative",
  absolute: "absolute",
  fixed: "fixed",
  sticky: "sticky",
};

const widthClass: Record<NonNullable<StyleConfig["width"]>, string> = {
  auto: "w-auto",
  full: "w-full",
  fit: "w-fit",
  "1/2": "w-1/2",
  "1/3": "w-1/3",
  "2/3": "w-2/3",
};

const opacityClass = (opacity?: number) => {
  if (opacity === undefined || opacity >= 1) return "";
  if (opacity <= 0) return "opacity-0";
  return `opacity-[${Math.round(opacity * 100)}%]`;
};

const zIndexClass = (zIndex?: number) => (zIndex === undefined ? "" : `z-[${zIndex}]`);

const arbitraryOrUtilityClass = (value: string | undefined, prefix: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith(`${prefix}-`)) return trimmed;
  return `${prefix}-[${trimmed}]`;
};

const passthroughClass = (value?: string) => value?.trim() ?? "";

const isTailwindUtilityValue = (value: string | undefined, prefix: string) => {
  const trimmed = value?.trim();
  return Boolean(trimmed && trimmed.startsWith(`${prefix}-`));
};

const rawInlineValue = (value: string | undefined, prefix: string) => {
  const trimmed = value?.trim();
  if (!trimmed || isTailwindUtilityValue(trimmed, prefix)) return undefined;
  return trimmed;
};

export function getResolvedStyles(node: ElementNode, viewport: Viewport): StyleConfig {
  if (viewport === "desktop") return { ...node.styles.desktop };
  return {
    ...node.styles.desktop,
    ...(node.styles[viewport] ?? {}),
  };
}

export function styleConfigToInlineStyle(style: StyleConfig): CSSProperties {
  return {
    maxWidth: rawInlineValue(style.maxWidth, "max-w"),
    minHeight: rawInlineValue(style.minHeight, "min-h"),
    height: rawInlineValue(style.height, "h"),
    top: rawInlineValue(style.insetTop, "top"),
    right: rawInlineValue(style.insetRight, "right"),
    bottom: rawInlineValue(style.insetBottom, "bottom"),
    left: rawInlineValue(style.insetLeft, "left"),
    gridTemplateColumns: rawInlineValue(style.gridColumns, "grid-cols"),
  };
}

export function styleConfigToTailwindClasses(style: StyleConfig): string {
  const classes = [
    style.display ? displayClass[style.display] : "",
    style.display === "flex" && style.flexDirection ? flexDirectionClass[style.flexDirection] : "",
    style.justifyContent ? justifyClass[style.justifyContent] : "",
    style.alignItems ? alignClass[style.alignItems] : "",
    style.position ? positionClass[style.position] : "",
    style.width ? widthClass[style.width] : "",
    arbitraryOrUtilityClass(style.maxWidth, "max-w"),
    arbitraryOrUtilityClass(style.minHeight, "min-h"),
    arbitraryOrUtilityClass(style.height, "h"),
    arbitraryOrUtilityClass(style.insetTop, "top"),
    arbitraryOrUtilityClass(style.insetRight, "right"),
    arbitraryOrUtilityClass(style.insetBottom, "bottom"),
    arbitraryOrUtilityClass(style.insetLeft, "left"),
    style.gridColumns ? arbitraryOrUtilityClass(style.gridColumns, "grid-cols") : "",
    style.padding,
    style.margin,
    style.gap,
    style.borderRadius,
    passthroughClass(style.border),
    passthroughClass(style.shadow),
    style.fontSize,
    style.fontWeight,
    style.background,
    style.textColor,
    opacityClass(style.opacity),
    zIndexClass(style.zIndex),
    style.overflow ? `overflow-${style.overflow}` : "",
    passthroughClass(style.customClassName),
  ];

  return classes.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export function suggestMobileStyle(style: StyleConfig): Partial<StyleConfig> {
  const next: Partial<StyleConfig> = { ...style };

  if (style.display === "flex" && style.flexDirection === "row") next.flexDirection = "column";
  if (style.display === "grid") {
    next.display = "flex";
    next.flexDirection = "column";
  }
  if (style.padding?.includes("px-10") || style.padding?.includes("p-8")) next.padding = "p-5";
  if (style.padding?.includes("min-h-screen")) next.padding = "px-5 py-14 min-h-screen";
  if (style.fontSize === "text-6xl" || style.fontSize === "text-5xl") next.fontSize = "text-4xl";
  if (style.fontSize === "text-4xl") next.fontSize = "text-2xl";
  if (style.width === "1/2" || style.width === "1/3" || style.width === "2/3") next.width = "full";

  return next;
}
