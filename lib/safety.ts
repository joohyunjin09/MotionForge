import type { AnimationConfig, ButtonType, ElementNode, ElementType, FormMethod, HeadingLevel, InputType, ListType, StyleConfig } from "./types";

export const ELEMENT_NAME_MAX_LENGTH = 80;
export const TEXT_CONTENT_MAX_LENGTH = 2000;
export const SHORT_TEXT_MAX_LENGTH = 500;
export const PLACEHOLDER_MAX_LENGTH = 200;
export const ALT_TEXT_MAX_LENGTH = 300;
export const URL_MAX_LENGTH = 500;
export const CUSTOM_CLASS_MAX_LENGTH = 2000;
export const CUSTOM_CLASS_MAX_TOKENS = 120;
export const RAW_STYLE_VALUE_MAX_LENGTH = 200;
export const GRID_COLUMNS_MAX_LENGTH = 300;
export const ANIMATION_STRING_MAX_LENGTH = 200;

export const SAFETY_LIMITS = {
  elementName: ELEMENT_NAME_MAX_LENGTH,
  textContent: TEXT_CONTENT_MAX_LENGTH,
  shortText: SHORT_TEXT_MAX_LENGTH,
  placeholder: PLACEHOLDER_MAX_LENGTH,
  altText: ALT_TEXT_MAX_LENGTH,
  url: URL_MAX_LENGTH,
  customClassName: CUSTOM_CLASS_MAX_LENGTH,
  maxClassTokens: CUSTOM_CLASS_MAX_TOKENS,
  rawCss: RAW_STYLE_VALUE_MAX_LENGTH,
  gridColumns: GRID_COLUMNS_MAX_LENGTH,
  animationString: ANIMATION_STRING_MAX_LENGTH,
  diagnostics: 20,
  treeDepth: 30,
  maxFlattenedNodes: 1000,
  maxIndentLevel: 40,
} as const;

export const SAFE_EASE_FALLBACK = "power3.out";

const allowedInputTypes = new Set<InputType>(["text", "email", "password", "number", "search", "tel", "url", "date", "time", "color", "checkbox", "radio", "range"]);
const allowedButtonTypes = new Set<ButtonType>(["button", "submit", "reset"]);
const allowedListTypes = new Set<ListType>(["unordered", "ordered"]);
const allowedFormMethods = new Set<FormMethod>(["get", "post"]);
const safeEasePattern = /^(?:none|ease-out|power[1-4]\.out|expo\.out|back\.out(?:\(1\.7\))?|elastic\.out\(1,\s*0\.3\))$/;
const numericScrollPattern = /^\+?=?\s*(-?\d+(?:\.\d+)?)$/;

export function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function clampOptionalNumber(value: unknown, min: number, max: number): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(max, Math.max(min, parsed));
}

export function clampString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength);
}

export function normalizeLimitedString(value: unknown, maxLength: number): string {
  return clampString(value, maxLength).replace(/\s+/g, " ").trim();
}

export function textContentMaxLengthForType(type: unknown): number {
  return type === "paragraph" ? SAFETY_LIMITS.textContent : SAFETY_LIMITS.shortText;
}

export function safeElementName(value: unknown): string {
  const trimmed = clampString(value, SAFETY_LIMITS.elementName).trim();
  return trimmed || "element";
}

export function normalizeCssLength(value: unknown, maxLength: number = SAFETY_LIMITS.rawCss): string | undefined {
  const normalized = clampString(value, maxLength).replace(/\s+/g, " ");
  return normalized.trim() ? normalized.trimStart() : undefined;
}

function normalizeCssToken(value: unknown, maxLength: number = SAFETY_LIMITS.rawCss): string | undefined {
  return normalizeCssLength(value, maxLength)?.trim() || undefined;
}

function normalizeLegacyWidthValue(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const legacyWidthValues: Record<string, string> = {
    auto: "w-auto",
    full: "w-full",
    fit: "w-fit",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "2/3": "w-2/3",
    "1/4": "w-1/4",
    "3/4": "w-3/4",
  };

  return value
    .split(" ")
    .map((token) => legacyWidthValues[token] ?? token)
    .join(" ");
}

export function normalizeClassName(value: unknown, maxLength: number = SAFETY_LIMITS.customClassName, maxTokens: number = SAFETY_LIMITS.maxClassTokens): string | undefined {
  const normalized = clampString(value, maxLength).replace(/\s+/g, " ").trimStart();
  const trimmed = normalized.trim();
  if (!trimmed) return undefined;

  const tokens = trimmed.split(" ").filter(Boolean).slice(0, maxTokens);
  const trailingSpace = normalized.endsWith(" ") && tokens.length < maxTokens ? " " : "";
  return `${tokens.join(" ")}${trailingSpace}` || undefined;
}

export function sanitizeClassName(value: string): string {
  return normalizeClassName(value) ?? "";
}

export function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function safeChildren(node: Pick<ElementNode, "children"> | null | undefined): ElementNode[] {
  return safeArray<ElementNode>(node?.children);
}

export function isProbablyDangerousUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");
  return normalized.startsWith("javascript:") || normalized.startsWith("vbscript:") || normalized.startsWith("data:text/html");
}

export function safeUrl(value: unknown, fallback = ""): string {
  const trimmed = clampString(value, SAFETY_LIMITS.url).trim();
  if (!trimmed) return fallback;
  if (isProbablyDangerousUrl(trimmed)) return fallback;
  if (
    trimmed === "#" ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("#") ||
    /^https?:\/\//i.test(trimmed) ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed) ||
    /^data:image\//i.test(trimmed)
  ) {
    return trimmed;
  }
  return trimmed.includes(":") ? fallback : trimmed;
}

export function sanitizeUrl(value: string): string {
  return safeUrl(value, "#") || "#";
}

export function safeInputType(value: unknown): InputType {
  return allowedInputTypes.has(value as InputType) ? (value as InputType) : "text";
}

export function safeButtonType(value: unknown): ButtonType {
  return allowedButtonTypes.has(value as ButtonType) ? (value as ButtonType) : "button";
}

export function safeHeadingLevel(value: unknown): HeadingLevel {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  const rounded = Math.round(parsed);
  return rounded >= 1 && rounded <= 6 ? (rounded as HeadingLevel) : 1;
}

export function safeListType(value: unknown): ListType {
  return allowedListTypes.has(value as ListType) ? (value as ListType) : "unordered";
}

export function safeFormMethod(value: unknown): FormMethod {
  return allowedFormMethods.has(value as FormMethod) ? (value as FormMethod) : "post";
}

export function safeTarget(value: unknown): NonNullable<ElementNode["props"]["target"]> {
  return value === "_blank" ? "_blank" : "_self";
}

export function safeRows(value: unknown): number {
  return Math.round(clampNumber(value, 1, 20, 4));
}

export function safeAnimationNumber(value: unknown, min: number, max: number, fallback: number): number {
  return clampNumber(value, min, max, fallback);
}

export function safeEase(value: unknown): string {
  const trimmed = clampString(value, SAFETY_LIMITS.animationString).trim();
  return safeEasePattern.test(trimmed) ? trimmed : SAFE_EASE_FALLBACK;
}

export function safeScrollValue(value: unknown, fallback = "+=500"): string {
  const trimmed = clampString(value, SAFETY_LIMITS.animationString).trim();
  if (!trimmed) return fallback;
  const numericMatch = trimmed.match(numericScrollPattern);
  if (numericMatch) {
    const distance = clampNumber(numericMatch[1], 0, 10000, 500);
    return `+=${distance}`;
  }
  return trimmed.length <= SAFETY_LIMITS.animationString ? trimmed : fallback;
}

export function safeScrollSceneHeightValue(value: unknown): string | undefined {
  const trimmed = normalizeCssLength(value, SAFETY_LIMITS.animationString)?.trim();
  if (!trimmed) return undefined;

  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(px|vh)?$/i);
  if (!match) return trimmed;

  const amount = clampNumber(match[1], 0, 20000, 0);
  const unit = match[2] ?? "";
  return `${amount}${unit}`;
}

export function safeSceneHeightPixels(value: unknown, viewportHeight: number): number | null {
  const trimmed = clampString(value, SAFETY_LIMITS.animationString).trim();
  if (!trimmed) return null;
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return clampNumber(trimmed, 0, 20000, viewportHeight);
  if (/^\d+(?:\.\d+)?px$/.test(trimmed)) return clampNumber(Number.parseFloat(trimmed), 0, 20000, viewportHeight);
  if (/^\d+(?:\.\d+)?vh$/.test(trimmed)) return clampNumber((Number.parseFloat(trimmed) / 100) * viewportHeight, 0, 20000, viewportHeight);
  return null;
}

export function safeAnimationConfig(animation?: Partial<AnimationConfig> | null): AnimationConfig {
  return {
    mode: animation?.mode === "scroll" || animation?.mode === "flip" ? animation.mode : "tween",
    type:
      animation?.type === "fade-in" ||
      animation?.type === "slide-up" ||
      animation?.type === "slide-left" ||
      animation?.type === "scale-in" ||
      animation?.type === "blur-in"
        ? animation.type
        : "none",
    trigger: animation?.trigger === "scroll-enter" || animation?.trigger === "hover" ? animation.trigger : "page-load",
    duration: safeAnimationNumber(animation?.duration, 0, 30, 0.8),
    delay: safeAnimationNumber(animation?.delay, 0, 30, 0),
    ease: safeEase(animation?.ease),
    stagger: clampOptionalNumber(animation?.stagger, 0, 10) ?? 0,
    x: clampOptionalNumber(animation?.x, -5000, 5000),
    y: clampOptionalNumber(animation?.y, -5000, 5000),
    rotate: clampOptionalNumber(animation?.rotate, -3600, 3600),
    scale: clampOptionalNumber(animation?.scale, 0, 20),
    opacity: clampOptionalNumber(animation?.opacity, 0, 1),
    blur: clampOptionalNumber(animation?.blur, 0, 100),
    transformOrigin: normalizeCssToken(animation?.transformOrigin, SAFETY_LIMITS.animationString),
    repeat: clampOptionalNumber(animation?.repeat, -1, 100),
    yoyo: Boolean(animation?.yoyo),
    triggerTargetId: normalizeCssToken(animation?.triggerTargetId, SAFETY_LIMITS.animationString),
    interactionTargetId: normalizeCssToken(animation?.interactionTargetId, SAFETY_LIMITS.animationString),
    scrollStart: normalizeCssToken(animation?.scrollStart, SAFETY_LIMITS.animationString),
    scrollEnd: normalizeCssToken(animation?.scrollEnd, SAFETY_LIMITS.animationString),
    scrollDistance: animation?.scrollDistance ? safeScrollValue(animation.scrollDistance) : undefined,
    scrollSceneHeight: safeScrollSceneHeightValue(animation?.scrollSceneHeight),
    scrub: typeof animation?.scrub === "number" ? clampNumber(animation.scrub, 0, 10, 1) : animation?.scrub === true ? true : undefined,
    pin: Boolean(animation?.pin),
    markers: Boolean(animation?.markers),
    once: animation?.once,
    toggleActions: normalizeCssToken(animation?.toggleActions, SAFETY_LIMITS.animationString),
    flipPreset:
      animation?.flipPreset === "none" ||
      animation?.flipPreset === "swap" ||
      animation?.flipPreset === "reorder" ||
      animation?.flipPreset === "card-pop"
        ? animation.flipPreset
        : "expand",
    flipAbsolute: Boolean(animation?.flipAbsolute),
    flipScale: Boolean(animation?.flipScale),
    flipSimple: Boolean(animation?.flipSimple),
    flipFade: Boolean(animation?.flipFade),
    flipProps: normalizeCssToken(animation?.flipProps, SAFETY_LIMITS.animationString),
  };
}

export function sanitizeStyleConfig(style?: Partial<StyleConfig> | null): StyleConfig {
  return {
    ...style,
    width: normalizeLegacyWidthValue(normalizeCssLength(style?.width)),
    minWidth: normalizeCssLength(style?.minWidth),
    maxWidth: normalizeCssLength(style?.maxWidth),
    maxHeight: normalizeCssLength(style?.maxHeight),
    minHeight: normalizeCssLength(style?.minHeight),
    height: normalizeCssLength(style?.height),
    padding: normalizeCssLength(style?.padding),
    paddingX: normalizeCssLength(style?.paddingX),
    paddingY: normalizeCssLength(style?.paddingY),
    paddingTop: normalizeCssLength(style?.paddingTop),
    paddingRight: normalizeCssLength(style?.paddingRight),
    paddingBottom: normalizeCssLength(style?.paddingBottom),
    paddingLeft: normalizeCssLength(style?.paddingLeft),
    margin: normalizeCssLength(style?.margin),
    marginX: normalizeCssLength(style?.marginX),
    marginY: normalizeCssLength(style?.marginY),
    marginTop: normalizeCssLength(style?.marginTop),
    marginRight: normalizeCssLength(style?.marginRight),
    marginBottom: normalizeCssLength(style?.marginBottom),
    marginLeft: normalizeCssLength(style?.marginLeft),
    gap: normalizeCssLength(style?.gap),
    rowGap: normalizeCssLength(style?.rowGap),
    columnGap: normalizeCssLength(style?.columnGap),
    insetTop: normalizeCssLength(style?.insetTop),
    insetRight: normalizeCssLength(style?.insetRight),
    insetBottom: normalizeCssLength(style?.insetBottom),
    insetLeft: normalizeCssLength(style?.insetLeft),
    background: normalizeCssLength(style?.background),
    textColor: normalizeCssLength(style?.textColor),
    border: normalizeCssLength(style?.border),
    borderColor: normalizeCssLength(style?.borderColor),
    shadow: normalizeCssLength(style?.shadow),
    gridColumns: normalizeCssLength(style?.gridColumns, SAFETY_LIMITS.gridColumns),
    aspectRatio: normalizeCssLength(style?.aspectRatio),
    lineHeight: normalizeCssLength(style?.lineHeight),
    letterSpacing: normalizeCssLength(style?.letterSpacing),
    customClassName: normalizeClassName(style?.customClassName),
    opacity: style?.opacity === undefined ? undefined : clampNumber(style.opacity, 0, 1, 1),
    zIndex: style?.zIndex === undefined ? undefined : Math.round(clampNumber(style.zIndex, -9999, 9999, 0)),
  };
}

export function safeElementType(type: unknown): ElementType | "unknown" {
  const supported = new Set<ElementType>([
    "section",
    "div",
    "header",
    "main",
    "footer",
    "nav",
    "article",
    "aside",
    "heading",
    "paragraph",
    "span",
    "link",
    "button",
    "image",
    "list",
    "listItem",
    "form",
    "label",
    "input",
    "textarea",
  ]);
  return supported.has(type as ElementType) ? (type as ElementType) : "unknown";
}
