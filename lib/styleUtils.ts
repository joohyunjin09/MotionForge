import type { CSSProperties } from "react";
import type { ElementNode, StyleConfig, Viewport } from "./types";
import { clampNumber, normalizeClassName, normalizeCssLength, sanitizeStyleConfig } from "./safety";

export const viewports: Viewport[] = ["desktop", "tablet", "mobile"];

export const displayOptions = ["block", "flex", "grid"] as const;
export const flexDirectionOptions = ["row", "column"] as const;
export const justifyOptions = ["start", "center", "end", "between", "around", "evenly"];
export const alignOptions = ["start", "center", "end", "stretch"];
export const positionOptions = ["static", "relative", "absolute", "fixed", "sticky"] as const;
export const widthSuggestions = ["w-auto", "w-full", "w-fit", "w-screen", "w-1/2", "w-1/3", "w-2/3", "w-1/4", "w-3/4", "100%", "50%", "600px"] as const;
export const minWidthSuggestions = ["min-w-0", "min-w-full", "min-w-fit", "320px", "50%"] as const;
export const maxWidthSuggestions = ["max-w-none", "max-w-sm", "max-w-md", "max-w-lg", "max-w-xl", "max-w-2xl", "max-w-4xl", "max-w-6xl", "max-w-7xl", "max-w-[1120px]", "1120px"] as const;
export const heightSuggestions = ["h-auto", "h-full", "h-screen", "h-64", "h-80", "h-96", "400px", "80vh", "auto"] as const;
export const minHeightSuggestions = ["min-h-0", "min-h-full", "min-h-screen", "400px", "80vh"] as const;
export const maxHeightSuggestions = ["max-h-none", "max-h-full", "max-h-screen", "400px", "80vh"] as const;
export const paddingSuggestions = ["p-0", "p-2", "p-4", "p-5", "p-6", "p-8", "p-10", "16px", "24px", "2rem"] as const;
export const paddingXSuggestions = ["px-0", "px-2", "px-4", "px-5", "px-6", "px-8", "px-10", "24px"] as const;
export const paddingYSuggestions = ["py-0", "py-2", "py-4", "py-6", "py-8", "py-10", "py-16", "32px"] as const;
export const paddingSideSuggestions = ["0", "16px", "24px", "2rem"] as const;
export const marginSuggestions = ["m-0", "mx-auto", "mt-4", "mt-8", "mb-4", "my-8", "0", "auto", "24px"] as const;
export const marginXSuggestions = ["mx-0", "mx-auto", "mx-4", "mx-8", "0", "auto", "24px"] as const;
export const marginYSuggestions = ["my-0", "my-4", "my-8", "my-12", "0", "24px"] as const;
export const marginSideSuggestions = ["0", "auto", "16px", "24px", "2rem"] as const;
export const gapSuggestions = ["gap-0", "gap-2", "gap-4", "gap-6", "gap-8", "gap-10", "gap-12", "24px", "2rem"] as const;
export const rowGapSuggestions = ["gap-y-0", "gap-y-2", "gap-y-4", "gap-y-6", "gap-y-8", "24px", "2rem"] as const;
export const columnGapSuggestions = ["gap-x-0", "gap-x-2", "gap-x-4", "gap-x-6", "gap-x-8", "24px", "2rem"] as const;
export const widthOptions = widthSuggestions;
export const paddingOptions = paddingSuggestions;
export const marginOptions = marginSuggestions;
export const gapOptions = gapSuggestions;
export const radiusOptions = ["rounded-none", "rounded-md", "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-full"];
export const fontSizeOptions = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-4xl", "text-5xl", "text-6xl"];
export const fontWeightOptions = ["font-normal", "font-medium", "font-semibold", "font-bold", "font-extrabold"];
export const backgroundColorSuggestions = [
  "bg-transparent",
  "bg-white",
  "bg-black",
  "bg-slate-950",
  "bg-slate-900",
  "bg-slate-100",
  "bg-white/10",
  "bg-cyan-300",
  "bg-blue-600",
  "bg-red-500",
  "bg-green-500",
  "bg-yellow-400",
  "bg-violet-500",
  "bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500",
] as const;
export const textColorSuggestions = [
  "text-slate-950",
  "text-slate-700",
  "text-slate-500",
  "text-slate-300",
  "text-white",
  "text-black",
  "text-cyan-300",
  "text-blue-500",
  "text-red-500",
  "text-green-500",
  "text-yellow-400",
  "text-violet-500",
] as const;
export const borderColorSuggestions = [
  "border-slate-200",
  "border-slate-700",
  "border-white/20",
  "border-cyan-300",
  "border-blue-500",
  "border-red-500",
  "border-green-500",
  "border-violet-500",
] as const;
export const backgroundOptions = backgroundColorSuggestions;
export const textColorOptions = textColorSuggestions;
export const textAlignOptions = ["left", "center", "right", "justify"] as const;
export const lineHeightOptions = ["leading-none", "leading-tight", "leading-snug", "leading-normal", "leading-relaxed", "leading-loose"];
export const letterSpacingOptions = ["tracking-tighter", "tracking-tight", "tracking-normal", "tracking-wide", "tracking-wider", "tracking-widest"];
export const textTransformOptions = ["normal-case", "uppercase", "lowercase", "capitalize"] as const;
export const aspectRatioOptions = ["aspect-auto", "aspect-square", "aspect-video"];
export const objectFitOptions = ["contain", "cover", "fill", "none", "scale-down"] as const;
export const objectPositionOptions = ["center", "top", "bottom", "left", "right"] as const;
export const whiteSpaceOptions = ["normal", "nowrap", "pre-line", "pre-wrap"] as const;
export const overflowOptions = ["visible", "hidden"] as const;
export const animationTypeOptions = ["none", "fade-in", "slide-up", "slide-left", "scale-in", "blur-in"] as const;
export const triggerOptions = ["page-load", "scroll-enter", "hover"] as const;
export const easeOptions = ["power1.out", "power2.out", "power3.out", "power4.out", "back.out", "back.out(1.7)", "elastic.out(1, 0.3)", "expo.out", "ease-out", "none"];
export const animationModeOptions = ["tween", "scroll", "flip"] as const;
export const transformOriginOptions = ["center center", "top left", "top center", "top right", "center left", "center right", "bottom left", "bottom center", "bottom right"];
export const toggleActionsOptions = ["play none none none", "play reverse play reverse", "restart none none none", "restart pause resume reset", "play pause resume reset"];
export const scrollStartOptions = ["top bottom", "top 80%", "top center", "center center", "bottom bottom"];
export const scrollEndOptions = ["bottom top", "bottom center", "+=300", "+=500", "+=1000"];
export const flipPresetOptions = ["none", "expand", "swap", "reorder", "card-pop"] as const;

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

const legacyWidthClass: Record<string, string> = {
  auto: "w-auto",
  full: "w-full",
  fit: "w-fit",
  "1/2": "w-1/2",
  "1/3": "w-1/3",
  "2/3": "w-2/3",
  "1/4": "w-1/4",
  "3/4": "w-3/4",
};

const textAlignClass: Record<NonNullable<StyleConfig["textAlign"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

const objectFitClass: Record<NonNullable<StyleConfig["objectFit"]>, string> = {
  contain: "object-contain",
  cover: "object-cover",
  fill: "object-fill",
  none: "object-none",
  "scale-down": "object-scale-down",
};

const objectPositionClass: Record<NonNullable<StyleConfig["objectPosition"]>, string> = {
  center: "object-center",
  top: "object-top",
  bottom: "object-bottom",
  left: "object-left",
  right: "object-right",
};

const whiteSpaceClass: Record<NonNullable<StyleConfig["whiteSpace"]>, string> = {
  normal: "whitespace-normal",
  nowrap: "whitespace-nowrap",
  "pre-line": "whitespace-pre-line",
  "pre-wrap": "whitespace-pre-wrap",
};

const tailwindColorFamily = "(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)";
const tailwindColorShade = "(?:50|100|200|300|400|500|600|700|800|900|950)";
const tailwindSpecialColor = "(?:inherit|current|transparent|black|white)(?:/[-\\w.%\\[\\]]+)?";
const tailwindColorSuffix = `(?:\\[[^\\s]+\\]|${tailwindSpecialColor}|${tailwindColorFamily}-${tailwindColorShade}(?:/[-\\w.%\\[\\]]+)?)`;
const textColorUtilityPattern = new RegExp(`^text-${tailwindColorSuffix}$`);
const backgroundColorUtilityPattern = new RegExp(`^bg-${tailwindColorSuffix}$`);
const borderColorUtilityPattern = new RegExp(`^border-${tailwindColorSuffix}$`);
const gradientStopUtilityPattern = new RegExp(`^(?:from|via|to)-${tailwindColorSuffix}$`);
const cssHexColorPattern = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const cssColorFunctionPattern = /^(?:rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\(.+\)$/i;

function splitUtilityTokens(value: string) {
  const tokens: string[] = [];
  let current = "";
  let bracketDepth = 0;

  for (const char of value) {
    if (/\s/.test(char) && bracketDepth === 0) {
      if (current) tokens.push(current);
      current = "";
      continue;
    }

    if (char === "[") bracketDepth += 1;
    if (char === "]" && bracketDepth > 0) bracketDepth -= 1;
    current += char;
  }

  if (current) tokens.push(current);
  return tokens;
}

type UtilityTokenMatcher = (className: string) => boolean;
type UtilityTokenNormalizer = (className: string) => string;

const identityToken: UtilityTokenNormalizer = (className) => className;
const normalizeLegacyWidthToken: UtilityTokenNormalizer = (className) => legacyWidthClass[className] ?? className;
const stripNegativePrefix = (className: string) => (className.startsWith("-") ? className.slice(1) : className);

export function isTailwindWidthClass(className: string) {
  return /^w-.+/.test(className);
}

export function isTailwindMinWidthClass(className: string) {
  return /^min-w-.+/.test(className);
}

export function isTailwindMaxWidthClass(className: string) {
  return /^max-w-.+/.test(className);
}

export function isTailwindHeightClass(className: string) {
  return /^h-.+/.test(className);
}

export function isTailwindMinHeightClass(className: string) {
  return /^min-h-.+/.test(className);
}

export function isTailwindMaxHeightClass(className: string) {
  return /^max-h-.+/.test(className);
}

export function isTailwindPaddingClass(className: string) {
  return /^(?:p|px|py|pt|pr|pb|pl)-.+/.test(className);
}

const isTailwindPaddingXClass = (className: string) => /^px-.+/.test(className);
const isTailwindPaddingYClass = (className: string) => /^py-.+/.test(className);
const isTailwindPaddingTopClass = (className: string) => /^pt-.+/.test(className);
const isTailwindPaddingRightClass = (className: string) => /^pr-.+/.test(className);
const isTailwindPaddingBottomClass = (className: string) => /^pb-.+/.test(className);
const isTailwindPaddingLeftClass = (className: string) => /^pl-.+/.test(className);

export function isTailwindMarginClass(className: string) {
  return /^(?:m|mx|my|mt|mr|mb|ml)-.+/.test(stripNegativePrefix(className));
}

const isTailwindMarginXClass = (className: string) => /^mx-.+/.test(stripNegativePrefix(className));
const isTailwindMarginYClass = (className: string) => /^my-.+/.test(stripNegativePrefix(className));
const isTailwindMarginTopClass = (className: string) => /^mt-.+/.test(stripNegativePrefix(className));
const isTailwindMarginRightClass = (className: string) => /^mr-.+/.test(stripNegativePrefix(className));
const isTailwindMarginBottomClass = (className: string) => /^mb-.+/.test(stripNegativePrefix(className));
const isTailwindMarginLeftClass = (className: string) => /^ml-.+/.test(stripNegativePrefix(className));

export function isTailwindGapClass(className: string) {
  return /^(?:gap|gap-x|gap-y)-.+/.test(className);
}

const isTailwindRowGapClass = (className: string) => /^gap-y-.+/.test(className);
const isTailwindColumnGapClass = (className: string) => /^gap-x-.+/.test(className);

const isTailwindInsetTopClass = (className: string) => /^top-.+/.test(stripNegativePrefix(className));
const isTailwindInsetRightClass = (className: string) => /^right-.+/.test(stripNegativePrefix(className));
const isTailwindInsetBottomClass = (className: string) => /^bottom-.+/.test(stripNegativePrefix(className));
const isTailwindInsetLeftClass = (className: string) => /^left-.+/.test(stripNegativePrefix(className));
const isLegacyMinHeightClass = (className: string) => /^min-h-.+/.test(className);
const isTailwindPaddingOrLegacyClass = (className: string) => isTailwindPaddingClass(className) || isLegacyMinHeightClass(className);

const utilityClassesFromValue = (
  value: string | undefined,
  matcher: UtilityTokenMatcher,
  normalizeToken: UtilityTokenNormalizer = identityToken,
) => {
  const trimmed = normalizeCssLength(value)?.trim();
  if (!trimmed) return "";

  return splitUtilityTokens(trimmed)
    .map(normalizeToken)
    .filter(matcher)
    .join(" ");
};

const rawInlineValue = (
  value: string | undefined,
  matcher: UtilityTokenMatcher,
  normalizeToken: UtilityTokenNormalizer = identityToken,
) => {
  const trimmed = normalizeCssLength(value)?.trim();
  if (!trimmed) return undefined;

  const tokens = splitUtilityTokens(trimmed).map(normalizeToken);
  if (tokens.some(matcher)) return undefined;
  return trimmed;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const arbitraryUtilityInlineValue = (value: string | undefined, prefix: string) => {
  const trimmed = normalizeCssLength(value)?.trim();
  const match = trimmed?.match(new RegExp(`^(-?)${escapeRegExp(prefix)}-\\[(.+)\\]$`));
  if (!match) return undefined;
  return `${match[1]}${match[2].replace(/_/g, " ")}`;
};

export function isRawCssColor(value: unknown): boolean {
  const trimmed = normalizeCssLength(value)?.trim();
  if (!trimmed || /[;{}]/.test(trimmed)) return false;

  const lower = trimmed.toLowerCase();
  return (
    cssHexColorPattern.test(trimmed) ||
    cssColorFunctionPattern.test(trimmed) ||
    /^var\(.+\)$/i.test(trimmed) ||
    lower === "transparent" ||
    lower === "currentcolor" ||
    lower === "inherit" ||
    lower === "initial" ||
    lower === "unset" ||
    lower === "revert"
  );
}

export function isTailwindTextColorClass(className: string) {
  return textColorUtilityPattern.test(className);
}

export function isTailwindBackgroundClass(className: string) {
  return backgroundColorUtilityPattern.test(className) || /^bg-gradient(?:-.+)?$/.test(className) || gradientStopUtilityPattern.test(className);
}

export function isTailwindBorderColorClass(className: string) {
  return borderColorUtilityPattern.test(className);
}

export function isValidColorFieldValue(value: unknown, role: "text" | "background" | "border") {
  const trimmed = normalizeCssLength(value)?.trim();
  if (!trimmed) return true;
  if (isRawCssColor(trimmed)) return true;

  const tokens = splitUtilityTokens(trimmed);
  if (role === "text") return tokens.length === 1 && isTailwindTextColorClass(tokens[0]);
  if (role === "border") return tokens.length === 1 && isTailwindBorderColorClass(tokens[0]);
  return tokens.length > 0 && tokens.every(isTailwindBackgroundClass);
}

function textColorClass(value: string | undefined) {
  const trimmed = normalizeCssLength(value)?.trim();
  return trimmed && isTailwindTextColorClass(trimmed) ? trimmed : "";
}

function backgroundClass(value: string | undefined) {
  const trimmed = normalizeCssLength(value)?.trim();
  if (!trimmed) return "";
  const tokens = splitUtilityTokens(trimmed);
  return tokens.length > 0 && tokens.every((token) => (token.startsWith("bg-") && !/\s/.test(token)) || gradientStopUtilityPattern.test(token)) ? trimmed : "";
}

function borderColorClass(value: string | undefined) {
  const trimmed = normalizeCssLength(value)?.trim();
  return trimmed && isTailwindBorderColorClass(trimmed) ? trimmed : "";
}

function arbitraryColorInlineValue(value: string | undefined, prefix: "text" | "bg" | "border") {
  const trimmed = normalizeCssLength(value)?.trim();
  const match = trimmed?.match(new RegExp(`^${prefix}-\\[(.+)\\]$`));
  if (!match) return undefined;

  const rawColor = match[1].replace(/_/g, " ");
  return isRawCssColor(rawColor) ? rawColor : undefined;
}

function rawColorInlineValue(value: string | undefined) {
  const trimmed = normalizeCssLength(value)?.trim();
  return trimmed && isRawCssColor(trimmed) ? trimmed : undefined;
}

const opacityClass = (opacity?: number) => {
  opacity = opacity === undefined ? undefined : clampNumber(opacity, 0, 1, 1);
  if (opacity === undefined || opacity >= 1) return "";
  if (opacity <= 0) return "opacity-0";
  return `opacity-[${Math.round(opacity * 100)}%]`;
};

const arbitraryOrUtilityClass = (value: string | undefined, prefix: string) => {
  value = normalizeCssLength(value);
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith(`${prefix}-`)) return trimmed;
  return `${prefix}-[${trimmed}]`;
};

const aspectRatioClass = (value: string | undefined) => {
  const trimmed = normalizeCssLength(value)?.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("aspect-")) return trimmed;
  return `aspect-[${trimmed.replace(/\s*\/\s*/g, "/").replace(/\s+/g, "_")}]`;
};

const passthroughClass = (value?: string) => normalizeCssLength(value) ?? "";

function stripVariantPrefixes(className: string) {
  let bracketDepth = 0;
  let lastVariantSeparator = -1;

  for (let index = 0; index < className.length; index += 1) {
    const char = className[index];
    if (char === "[") bracketDepth += 1;
    if (char === "]" && bracketDepth > 0) bracketDepth -= 1;
    if (char === ":" && bracketDepth === 0) lastVariantSeparator = index;
  }

  return lastVariantSeparator >= 0 ? className.slice(lastVariantSeparator + 1) : className;
}

function isZeroOrAutoMarginValue(value: string) {
  return value === "auto" || /^-?0(?:px|rem|em|%|vh|vw|dvh|svh|lvh|vmin|vmax|ch)?$/i.test(value);
}

function hasFullWidthValue(value?: string) {
  const trimmed = normalizeCssLength(value)?.trim();
  if (!trimmed) return false;
  if (trimmed === "100%") return true;

  return splitUtilityTokens(trimmed)
    .map(stripVariantPrefixes)
    .map(normalizeLegacyWidthToken)
    .some((token) => token === "w-full");
}

function hasHorizontalMarginValue(value?: string, allowRawCssValue = true) {
  const trimmed = normalizeCssLength(value)?.trim();
  if (!trimmed) return false;

  return splitUtilityTokens(trimmed)
    .map(stripVariantPrefixes)
    .some((token) => {
      const positiveToken = stripNegativePrefix(token);
      if (/^(?:m|mx|ml|mr)-.+/.test(positiveToken)) {
        return !/^(?:m|mx|ml|mr)-(?:0|auto)$/.test(positiveToken);
      }

      if (/^(?:my|mt|mb)-.+/.test(positiveToken)) return false;
      return allowRawCssValue && !isZeroOrAutoMarginValue(token);
    });
}

export function shouldFitFullWidthInsideHorizontalMargins(style: StyleConfig) {
  style = sanitizeStyleConfig(style);
  const hasFullWidth =
    hasFullWidthValue(style.width) ||
    splitUtilityTokens(normalizeClassName(style.customClassName) ?? "")
      .map(stripVariantPrefixes)
      .map(normalizeLegacyWidthToken)
      .some((token) => token === "w-full");

  if (!hasFullWidth) return false;

  return [
    style.margin,
    style.marginX,
    style.marginLeft,
    style.marginRight,
  ].some((value) => hasHorizontalMarginValue(value)) || hasHorizontalMarginValue(style.customClassName, false);
}

export function getResolvedStyles(node: ElementNode, viewport: Viewport): StyleConfig {
  const desktop = node.styles?.desktop ?? {};
  if (viewport === "desktop") return sanitizeStyleConfig(desktop);
  return sanitizeStyleConfig({
    ...desktop,
    ...(node.styles?.[viewport] ?? {}),
  });
}

export function styleConfigToInlineStyle(style: StyleConfig): CSSProperties {
  style = sanitizeStyleConfig(style);
  const inline: CSSProperties = {
    width: arbitraryUtilityInlineValue(style.width, "w") ?? rawInlineValue(style.width, isTailwindWidthClass, normalizeLegacyWidthToken),
    minWidth: arbitraryUtilityInlineValue(style.minWidth, "min-w") ?? rawInlineValue(style.minWidth, isTailwindMinWidthClass),
    maxWidth: arbitraryUtilityInlineValue(style.maxWidth, "max-w") ?? rawInlineValue(style.maxWidth, isTailwindMaxWidthClass),
    height: arbitraryUtilityInlineValue(style.height, "h") ?? rawInlineValue(style.height, isTailwindHeightClass),
    minHeight: arbitraryUtilityInlineValue(style.minHeight, "min-h") ?? rawInlineValue(style.minHeight, isTailwindMinHeightClass),
    maxHeight: arbitraryUtilityInlineValue(style.maxHeight, "max-h") ?? rawInlineValue(style.maxHeight, isTailwindMaxHeightClass),
    padding: arbitraryUtilityInlineValue(style.padding, "p") ?? rawInlineValue(style.padding, isTailwindPaddingOrLegacyClass),
    margin: arbitraryUtilityInlineValue(style.margin, "m") ?? rawInlineValue(style.margin, isTailwindMarginClass),
    gap: arbitraryUtilityInlineValue(style.gap, "gap") ?? rawInlineValue(style.gap, isTailwindGapClass),
    rowGap: arbitraryUtilityInlineValue(style.rowGap, "gap-y") ?? rawInlineValue(style.rowGap, isTailwindRowGapClass),
    columnGap: arbitraryUtilityInlineValue(style.columnGap, "gap-x") ?? rawInlineValue(style.columnGap, isTailwindColumnGapClass),
    top: arbitraryUtilityInlineValue(style.insetTop, "top") ?? rawInlineValue(style.insetTop, isTailwindInsetTopClass),
    right: arbitraryUtilityInlineValue(style.insetRight, "right") ?? rawInlineValue(style.insetRight, isTailwindInsetRightClass),
    bottom: arbitraryUtilityInlineValue(style.insetBottom, "bottom") ?? rawInlineValue(style.insetBottom, isTailwindInsetBottomClass),
    left: arbitraryUtilityInlineValue(style.insetLeft, "left") ?? rawInlineValue(style.insetLeft, isTailwindInsetLeftClass),
    gridTemplateColumns: rawInlineValue(style.gridColumns, (className) => /^grid-cols-.+/.test(className)),
    aspectRatio: rawInlineValue(style.aspectRatio, (className) => /^aspect-.+/.test(className)),
    color: rawColorInlineValue(style.textColor) ?? arbitraryColorInlineValue(style.textColor, "text"),
    background: rawColorInlineValue(style.background) ?? arbitraryColorInlineValue(style.background, "bg"),
    borderColor: rawColorInlineValue(style.borderColor) ?? arbitraryColorInlineValue(style.borderColor, "border"),
    zIndex: style.zIndex === undefined ? undefined : Math.round(clampNumber(style.zIndex, -9999, 9999, 0)),
  };

  const paddingX = arbitraryUtilityInlineValue(style.paddingX, "px") ?? rawInlineValue(style.paddingX, isTailwindPaddingXClass);
  const paddingY = arbitraryUtilityInlineValue(style.paddingY, "py") ?? rawInlineValue(style.paddingY, isTailwindPaddingYClass);
  const paddingTop = arbitraryUtilityInlineValue(style.paddingTop, "pt") ?? rawInlineValue(style.paddingTop, isTailwindPaddingTopClass);
  const paddingRight = arbitraryUtilityInlineValue(style.paddingRight, "pr") ?? rawInlineValue(style.paddingRight, isTailwindPaddingRightClass);
  const paddingBottom = arbitraryUtilityInlineValue(style.paddingBottom, "pb") ?? rawInlineValue(style.paddingBottom, isTailwindPaddingBottomClass);
  const paddingLeft = arbitraryUtilityInlineValue(style.paddingLeft, "pl") ?? rawInlineValue(style.paddingLeft, isTailwindPaddingLeftClass);

  if (paddingX) {
    inline.paddingLeft = paddingX;
    inline.paddingRight = paddingX;
  }
  if (paddingY) {
    inline.paddingTop = paddingY;
    inline.paddingBottom = paddingY;
  }
  if (paddingTop) inline.paddingTop = paddingTop;
  if (paddingRight) inline.paddingRight = paddingRight;
  if (paddingBottom) inline.paddingBottom = paddingBottom;
  if (paddingLeft) inline.paddingLeft = paddingLeft;

  const marginX = arbitraryUtilityInlineValue(style.marginX, "mx") ?? rawInlineValue(style.marginX, isTailwindMarginXClass);
  const marginY = arbitraryUtilityInlineValue(style.marginY, "my") ?? rawInlineValue(style.marginY, isTailwindMarginYClass);
  const marginTop = arbitraryUtilityInlineValue(style.marginTop, "mt") ?? rawInlineValue(style.marginTop, isTailwindMarginTopClass);
  const marginRight = arbitraryUtilityInlineValue(style.marginRight, "mr") ?? rawInlineValue(style.marginRight, isTailwindMarginRightClass);
  const marginBottom = arbitraryUtilityInlineValue(style.marginBottom, "mb") ?? rawInlineValue(style.marginBottom, isTailwindMarginBottomClass);
  const marginLeft = arbitraryUtilityInlineValue(style.marginLeft, "ml") ?? rawInlineValue(style.marginLeft, isTailwindMarginLeftClass);

  if (marginX) {
    inline.marginLeft = marginX;
    inline.marginRight = marginX;
  }
  if (marginY) {
    inline.marginTop = marginY;
    inline.marginBottom = marginY;
  }
  if (marginTop) inline.marginTop = marginTop;
  if (marginRight) inline.marginRight = marginRight;
  if (marginBottom) inline.marginBottom = marginBottom;
  if (marginLeft) inline.marginLeft = marginLeft;

  return inline;
}

export function styleConfigToTailwindClasses(style: StyleConfig): string {
  style = sanitizeStyleConfig(style);
  const displayUtility = style.display === "grid" && style.gridColumns ? "grid" : style.display ? displayClass[style.display] : "";

  const classes = [
    displayUtility,
    style.display === "flex" && style.flexDirection ? flexDirectionClass[style.flexDirection] : "",
    style.justifyContent ? justifyClass[style.justifyContent] : "",
    style.alignItems ? alignClass[style.alignItems] : "",
    style.position ? positionClass[style.position] : "",
    utilityClassesFromValue(style.width, isTailwindWidthClass, normalizeLegacyWidthToken),
    utilityClassesFromValue(style.minWidth, isTailwindMinWidthClass),
    utilityClassesFromValue(style.maxWidth, isTailwindMaxWidthClass),
    utilityClassesFromValue(style.height, isTailwindHeightClass),
    utilityClassesFromValue(style.minHeight, isTailwindMinHeightClass),
    utilityClassesFromValue(style.maxHeight, isTailwindMaxHeightClass),
    utilityClassesFromValue(style.insetTop, isTailwindInsetTopClass),
    utilityClassesFromValue(style.insetRight, isTailwindInsetRightClass),
    utilityClassesFromValue(style.insetBottom, isTailwindInsetBottomClass),
    utilityClassesFromValue(style.insetLeft, isTailwindInsetLeftClass),
    style.gridColumns ? arbitraryOrUtilityClass(style.gridColumns, "grid-cols") : "",
    utilityClassesFromValue(style.padding, isTailwindPaddingOrLegacyClass),
    utilityClassesFromValue(style.paddingX, isTailwindPaddingXClass),
    utilityClassesFromValue(style.paddingY, isTailwindPaddingYClass),
    utilityClassesFromValue(style.paddingTop, isTailwindPaddingTopClass),
    utilityClassesFromValue(style.paddingRight, isTailwindPaddingRightClass),
    utilityClassesFromValue(style.paddingBottom, isTailwindPaddingBottomClass),
    utilityClassesFromValue(style.paddingLeft, isTailwindPaddingLeftClass),
    utilityClassesFromValue(style.margin, isTailwindMarginClass),
    utilityClassesFromValue(style.marginX, isTailwindMarginXClass),
    utilityClassesFromValue(style.marginY, isTailwindMarginYClass),
    utilityClassesFromValue(style.marginTop, isTailwindMarginTopClass),
    utilityClassesFromValue(style.marginRight, isTailwindMarginRightClass),
    utilityClassesFromValue(style.marginBottom, isTailwindMarginBottomClass),
    utilityClassesFromValue(style.marginLeft, isTailwindMarginLeftClass),
    utilityClassesFromValue(style.gap, isTailwindGapClass),
    utilityClassesFromValue(style.rowGap, isTailwindRowGapClass),
    utilityClassesFromValue(style.columnGap, isTailwindColumnGapClass),
    style.borderRadius,
    passthroughClass(style.border),
    borderColorClass(style.borderColor),
    passthroughClass(style.shadow),
    style.fontSize,
    style.fontWeight,
    backgroundClass(style.background),
    textColorClass(style.textColor),
    style.textAlign ? textAlignClass[style.textAlign] : "",
    passthroughClass(style.lineHeight),
    passthroughClass(style.letterSpacing),
    style.textTransform,
    aspectRatioClass(style.aspectRatio),
    style.objectFit ? objectFitClass[style.objectFit] : "",
    style.objectPosition ? objectPositionClass[style.objectPosition] : "",
    style.whiteSpace ? whiteSpaceClass[style.whiteSpace] : "",
    opacityClass(style.opacity),
    style.overflow ? `overflow-${style.overflow}` : "",
    normalizeClassName(style.customClassName),
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
  if (style.padding?.includes("min-h-screen")) {
    next.padding = "px-5 py-14";
    next.minHeight = "min-h-screen";
  }
  if (style.fontSize === "text-6xl" || style.fontSize === "text-5xl") next.fontSize = "text-4xl";
  if (style.fontSize === "text-4xl") next.fontSize = "text-2xl";
  if (["1/2", "1/3", "2/3", "1/4", "3/4", "w-1/2", "w-1/3", "w-2/3", "w-1/4", "w-3/4"].includes(style.width ?? "")) next.width = "w-full";

  return next;
}
