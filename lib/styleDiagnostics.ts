import type { ElementNode, StyleConfig, Viewport } from "./types";
import {
  getResolvedStyles,
  isTailwindBackgroundClass,
  isTailwindBorderColorClass,
  isTailwindHeightClass,
  isTailwindMaxHeightClass,
  isTailwindMaxWidthClass,
  isTailwindMinHeightClass,
  isTailwindMinWidthClass,
  isTailwindTextColorClass,
  isTailwindWidthClass,
  isValidColorFieldValue,
  shouldFitFullWidthInsideHorizontalMargins,
  styleConfigToTailwindClasses,
} from "./styleUtils";
import { clampString, isProbablyDangerousUrl, normalizeCssLength, SAFETY_LIMITS } from "./safety";

export type DiagnosticSeverity = "info" | "warning" | "error";

export type StyleDiagnostic = {
  id: string;
  severity: DiagnosticSeverity;
  title: string;
  message: string;
  field?: keyof StyleConfig | "customClassName" | "position" | "display";
  suggestion?: string;
};

type ConflictGroup = {
  id: string;
  label: string;
  field: StyleDiagnostic["field"];
  matches: (className: string) => boolean;
};

const positionClasses = new Set(["static", "relative", "absolute", "fixed", "sticky"]);
const displayClasses = new Set(["block", "flex", "grid", "hidden", "inline", "inline-block"]);
const textAlignClasses = new Set(["text-left", "text-center", "text-right", "text-justify"]);
const textTransformClasses = new Set(["normal-case", "uppercase", "lowercase", "capitalize"]);
const objectFitClasses = new Set(["object-contain", "object-cover", "object-fill", "object-none", "object-scale-down"]);
const objectPositionClasses = new Set(["object-center", "object-top", "object-bottom", "object-left", "object-right"]);
const whiteSpaceClasses = new Set(["whitespace-normal", "whitespace-nowrap", "whitespace-pre-line", "whitespace-pre-wrap"]);
const legacyWidthValues = new Set(["auto", "full", "fit", "1/2", "1/3", "2/3", "1/4", "3/4"]);

const stripNegativePrefix = (className: string) => (className.startsWith("-") ? className.slice(1) : className);
const isBasePaddingClass = (className: string) => /^p-.+/.test(className);
const isPaddingXClass = (className: string) => /^px-.+/.test(className);
const isPaddingYClass = (className: string) => /^py-.+/.test(className);
const isPaddingTopClass = (className: string) => /^pt-.+/.test(className);
const isPaddingRightClass = (className: string) => /^pr-.+/.test(className);
const isPaddingBottomClass = (className: string) => /^pb-.+/.test(className);
const isPaddingLeftClass = (className: string) => /^pl-.+/.test(className);
const isBaseMarginClass = (className: string) => /^m-.+/.test(stripNegativePrefix(className));
const isMarginXClass = (className: string) => /^mx-.+/.test(stripNegativePrefix(className));
const isMarginYClass = (className: string) => /^my-.+/.test(stripNegativePrefix(className));
const isMarginTopClass = (className: string) => /^mt-.+/.test(stripNegativePrefix(className));
const isMarginRightClass = (className: string) => /^mr-.+/.test(stripNegativePrefix(className));
const isMarginBottomClass = (className: string) => /^mb-.+/.test(stripNegativePrefix(className));
const isMarginLeftClass = (className: string) => /^ml-.+/.test(stripNegativePrefix(className));
const isBaseGapClass = (className: string) => /^gap-(?!x-|y-).+/.test(className);
const isRowGapClass = (className: string) => /^gap-y-.+/.test(className);
const isColumnGapClass = (className: string) => /^gap-x-.+/.test(className);

const conflictGroups: ConflictGroup[] = [
  {
    id: "width",
    label: "width",
    field: "width",
    matches: isTailwindWidthClass,
  },
  {
    id: "minWidth",
    label: "min-width",
    field: "minWidth",
    matches: isTailwindMinWidthClass,
  },
  {
    id: "maxWidth",
    label: "max-width",
    field: "maxWidth",
    matches: isTailwindMaxWidthClass,
  },
  {
    id: "minHeight",
    label: "min-height",
    field: "minHeight",
    matches: isTailwindMinHeightClass,
  },
  {
    id: "height",
    label: "height",
    field: "height",
    matches: isTailwindHeightClass,
  },
  {
    id: "maxHeight",
    label: "max-height",
    field: "maxHeight",
    matches: isTailwindMaxHeightClass,
  },
  {
    id: "padding",
    label: "padding",
    field: "padding",
    matches: isBasePaddingClass,
  },
  {
    id: "paddingX",
    label: "horizontal padding",
    field: "paddingX",
    matches: isPaddingXClass,
  },
  {
    id: "paddingY",
    label: "vertical padding",
    field: "paddingY",
    matches: isPaddingYClass,
  },
  {
    id: "paddingTop",
    label: "top padding",
    field: "paddingTop",
    matches: isPaddingTopClass,
  },
  {
    id: "paddingRight",
    label: "right padding",
    field: "paddingRight",
    matches: isPaddingRightClass,
  },
  {
    id: "paddingBottom",
    label: "bottom padding",
    field: "paddingBottom",
    matches: isPaddingBottomClass,
  },
  {
    id: "paddingLeft",
    label: "left padding",
    field: "paddingLeft",
    matches: isPaddingLeftClass,
  },
  {
    id: "margin",
    label: "margin",
    field: "margin",
    matches: isBaseMarginClass,
  },
  {
    id: "marginX",
    label: "horizontal margin",
    field: "marginX",
    matches: isMarginXClass,
  },
  {
    id: "marginY",
    label: "vertical margin",
    field: "marginY",
    matches: isMarginYClass,
  },
  {
    id: "marginTop",
    label: "top margin",
    field: "marginTop",
    matches: isMarginTopClass,
  },
  {
    id: "marginRight",
    label: "right margin",
    field: "marginRight",
    matches: isMarginRightClass,
  },
  {
    id: "marginBottom",
    label: "bottom margin",
    field: "marginBottom",
    matches: isMarginBottomClass,
  },
  {
    id: "marginLeft",
    label: "left margin",
    field: "marginLeft",
    matches: isMarginLeftClass,
  },
  {
    id: "gap",
    label: "gap",
    field: "gap",
    matches: isBaseGapClass,
  },
  {
    id: "rowGap",
    label: "row gap",
    field: "rowGap",
    matches: isRowGapClass,
  },
  {
    id: "columnGap",
    label: "column gap",
    field: "columnGap",
    matches: isColumnGapClass,
  },
  {
    id: "position",
    label: "position",
    field: "position",
    matches: (className) => positionClasses.has(className),
  },
  {
    id: "display",
    label: "display",
    field: "display",
    matches: (className) => displayClasses.has(className),
  },
  {
    id: "insetTop",
    label: "top offset",
    field: "insetTop",
    matches: (className) => /^-?top-.+/.test(className),
  },
  {
    id: "insetRight",
    label: "right offset",
    field: "insetRight",
    matches: (className) => /^-?right-.+/.test(className),
  },
  {
    id: "insetBottom",
    label: "bottom offset",
    field: "insetBottom",
    matches: (className) => /^-?bottom-.+/.test(className),
  },
  {
    id: "insetLeft",
    label: "left offset",
    field: "insetLeft",
    matches: (className) => /^-?left-.+/.test(className),
  },
  {
    id: "textColor",
    label: "text color",
    field: "textColor",
    matches: isTailwindTextColorClass,
  },
  {
    id: "textAlign",
    label: "text-align",
    field: "textAlign",
    matches: (className) => textAlignClasses.has(className),
  },
  {
    id: "lineHeight",
    label: "line-height",
    field: "lineHeight",
    matches: (className) => /^leading-.+/.test(className),
  },
  {
    id: "letterSpacing",
    label: "letter-spacing",
    field: "letterSpacing",
    matches: (className) => /^tracking-.+/.test(className),
  },
  {
    id: "textTransform",
    label: "text transform",
    field: "textTransform",
    matches: (className) => textTransformClasses.has(className),
  },
  {
    id: "background",
    label: "background",
    field: "background",
    matches: isTailwindBackgroundClass,
  },
  {
    id: "borderColor",
    label: "border color",
    field: "borderColor",
    matches: isTailwindBorderColorClass,
  },
  {
    id: "gridColumns",
    label: "grid columns",
    field: "gridColumns",
    matches: (className) => /^grid-cols-.+/.test(className),
  },
  {
    id: "aspectRatio",
    label: "aspect-ratio",
    field: "aspectRatio",
    matches: (className) => /^aspect-.+/.test(className),
  },
  {
    id: "objectFit",
    label: "object-fit",
    field: "objectFit",
    matches: (className) => objectFitClasses.has(className),
  },
  {
    id: "objectPosition",
    label: "object-position",
    field: "objectPosition",
    matches: (className) => objectPositionClasses.has(className),
  },
  {
    id: "whiteSpace",
    label: "white-space",
    field: "whiteSpace",
    matches: (className) => whiteSpaceClasses.has(className),
  },
];

const rawValueFields: Array<{ field: keyof StyleConfig; prefixes: string[]; validLiterals?: Set<string>; suggestion: string }> = [
  { field: "width", prefixes: ["w"], validLiterals: legacyWidthValues, suggestion: "Use a Tailwind utility like w-full or a CSS value like 600px." },
  { field: "minWidth", prefixes: ["min-w"], suggestion: "Use a Tailwind utility like min-w-0 or a CSS value like 320px." },
  { field: "maxWidth", prefixes: ["max-w"], suggestion: "Use a Tailwind utility like max-w-6xl or a CSS value like 1200px." },
  { field: "height", prefixes: ["h"], suggestion: "Use a Tailwind utility like h-64 or a CSS value like 400px." },
  { field: "minHeight", prefixes: ["min-h"], suggestion: "Use a Tailwind utility like min-h-screen or a CSS value like 80vh." },
  { field: "maxHeight", prefixes: ["max-h"], suggestion: "Use a Tailwind utility like max-h-screen or a CSS value like 80vh." },
  { field: "padding", prefixes: ["p", "px", "py", "pt", "pr", "pb", "pl", "min-h"], suggestion: "Use a Tailwind utility like p-6 or a CSS value like 24px." },
  { field: "paddingX", prefixes: ["px"], suggestion: "Use a Tailwind utility like px-6 or a CSS value like 24px." },
  { field: "paddingY", prefixes: ["py"], suggestion: "Use a Tailwind utility like py-8 or a CSS value like 32px." },
  { field: "paddingTop", prefixes: ["pt"], suggestion: "Use a Tailwind utility like pt-4 or a CSS value like 16px." },
  { field: "paddingRight", prefixes: ["pr"], suggestion: "Use a Tailwind utility like pr-4 or a CSS value like 16px." },
  { field: "paddingBottom", prefixes: ["pb"], suggestion: "Use a Tailwind utility like pb-4 or a CSS value like 16px." },
  { field: "paddingLeft", prefixes: ["pl"], suggestion: "Use a Tailwind utility like pl-4 or a CSS value like 16px." },
  { field: "margin", prefixes: ["m", "mx", "my", "mt", "mr", "mb", "ml"], suggestion: "Use a Tailwind utility like mx-auto or a CSS value like 24px." },
  { field: "marginX", prefixes: ["mx"], suggestion: "Use a Tailwind utility like mx-auto or a CSS value like auto." },
  { field: "marginY", prefixes: ["my"], suggestion: "Use a Tailwind utility like my-8 or a CSS value like 24px." },
  { field: "marginTop", prefixes: ["mt"], suggestion: "Use a Tailwind utility like mt-8 or a CSS value like 24px." },
  { field: "marginRight", prefixes: ["mr"], suggestion: "Use a Tailwind utility like mr-4 or a CSS value like auto." },
  { field: "marginBottom", prefixes: ["mb"], suggestion: "Use a Tailwind utility like mb-4 or a CSS value like 24px." },
  { field: "marginLeft", prefixes: ["ml"], suggestion: "Use a Tailwind utility like ml-4 or a CSS value like auto." },
  { field: "gap", prefixes: ["gap", "gap-x", "gap-y"], suggestion: "Use a Tailwind utility like gap-8 or a CSS value like 24px." },
  { field: "rowGap", prefixes: ["gap-y"], suggestion: "Use a Tailwind utility like gap-y-8 or a CSS value like 24px." },
  { field: "columnGap", prefixes: ["gap-x"], suggestion: "Use a Tailwind utility like gap-x-8 or a CSS value like 24px." },
  { field: "insetTop", prefixes: ["top"], suggestion: "Use a Tailwind utility like top-4 or a CSS value like 20px." },
  { field: "insetRight", prefixes: ["right"], suggestion: "Use a Tailwind utility like right-0 or a CSS value like 10%." },
  { field: "insetBottom", prefixes: ["bottom"], suggestion: "Use a Tailwind utility like bottom-8 or a CSS value like auto." },
  { field: "insetLeft", prefixes: ["left"], suggestion: "Use a Tailwind utility like left-0 or a CSS value like 10%." },
];

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function splitClassName(className: string) {
  const tokens: string[] = [];
  let current = "";
  let bracketDepth = 0;

  for (const char of clampString(className, SAFETY_LIMITS.customClassName)) {
    if (/\s/.test(char) && bracketDepth === 0) {
      if (current) tokens.push(current);
      current = "";
      if (tokens.length >= SAFETY_LIMITS.maxClassTokens) break;
      continue;
    }

    if (char === "[") bracketDepth += 1;
    if (char === "]" && bracketDepth > 0) bracketDepth -= 1;
    current += char;
  }

  if (current && tokens.length < SAFETY_LIMITS.maxClassTokens) tokens.push(current);
  return tokens;
}

function stripVariants(className: string) {
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

function classConflictDiagnostic(group: ConflictGroup): StyleDiagnostic {
  if (group.id === "width") {
    return {
      id: "class-conflict-width",
      severity: "warning",
      title: "Conflicting width classes",
      message: "This element has multiple width classes. Tailwind usually applies the class generated later, so one of them may appear to do nothing.",
      field: group.field,
      suggestion: "Remove one width class or keep the value in only one field.",
    };
  }

  if (group.id === "maxWidth") {
    return {
      id: "class-conflict-max-width",
      severity: "warning",
      title: "Conflicting max-width classes",
      message: "This element has multiple max-width classes. One of them may override the other.",
      field: group.field,
      suggestion: "Use either the Max width field or Custom Tailwind classes, but not both for the same property.",
    };
  }

  return {
    id: `class-conflict-${group.id}`,
    severity: "warning",
    title: `Conflicting ${group.label} classes`,
    message: `This element has multiple ${group.label} classes. Tailwind usually applies the class generated later, so one of them may appear to do nothing.`,
    field: group.field,
    suggestion: "Remove one conflicting class or keep the value in only one field.",
  };
}

function collectClassConflicts(tokens: string[], skipGroupIds = new Set<string>()) {
  const diagnostics: StyleDiagnostic[] = [];
  const normalizedTokens = tokens.map(stripVariants);

  conflictGroups.forEach((group) => {
    if (skipGroupIds.has(group.id)) return;
    const matches = Array.from(new Set(normalizedTokens.filter(group.matches)));
    if (matches.length > 1) diagnostics.push(classConflictDiagnostic(group));
  });

  return diagnostics;
}

function isTailwindUtilityValue(value: string, prefix: string) {
  return value.startsWith(`${prefix}-`) || value.startsWith(`-${prefix}-`);
}

function isCssLengthValue(value: string) {
  return /^-?(?:0|(?:\d+|\d*\.\d+)(?:px|rem|vh|vw|dvh|svh|lvh|vmin|vmax|%|em|ch))$/.test(value);
}

function isCssFunctionValue(value: string) {
  return /^(?:calc|clamp|min|max)\(.+\)$/.test(value);
}

function isValidAdvancedValue(value: string, prefixes: string[], validLiterals?: Set<string>) {
  const trimmed = value.trim();
  if (trimmed === "auto" || validLiterals?.has(trimmed) || isCssLengthValue(trimmed) || isCssFunctionValue(trimmed)) return true;

  const tokens = splitClassName(trimmed).map(stripVariants);
  return tokens.length > 0 && tokens.every((token) => prefixes.some((prefix) => isTailwindUtilityValue(token, prefix)));
}

function isValidGridColumnsValue(value: string) {
  const trimmed = value.trim();
  if (/^grid-cols-(?:\d+|none|subgrid|\[.+\])$/.test(trimmed)) return true;
  if (/^(?:repeat|minmax)\(.+\)$/.test(trimmed)) return true;
  if (trimmed === "none" || trimmed === "subgrid") return true;
  if (/\b\d*\.?\d+fr\b/.test(trimmed)) return true;
  return /\s/.test(trimmed) && /(?:auto|min-content|max-content|fit-content|px|rem|%|repeat|minmax|fr)/.test(trimmed);
}

function collectRawValueDiagnostics(style: StyleConfig) {
  const diagnostics: StyleDiagnostic[] = [];

  rawValueFields.forEach(({ field, prefixes, validLiterals, suggestion }) => {
    const value = style[field];
    if (typeof value !== "string" || !value.trim()) return;
    const safeValue = normalizeCssLength(value);
    if (!safeValue || isValidAdvancedValue(safeValue, prefixes, validLiterals)) return;

    diagnostics.push({
      id: `invalid-value-${field}`,
      severity: "warning",
      title: "Value may be invalid",
      message: "This value does not look like a Tailwind utility or a valid CSS length. It may not apply.",
      field,
      suggestion,
    });
  });

  const safeGridColumns = normalizeCssLength(style.gridColumns, SAFETY_LIMITS.gridColumns);
  if (safeGridColumns && !isValidGridColumnsValue(safeGridColumns)) {
    diagnostics.push({
      id: "invalid-value-gridColumns",
      severity: "warning",
      title: "Grid columns value may be invalid",
      message: "This value does not look like a valid Tailwind grid-cols utility or CSS grid-template-columns value.",
      field: "gridColumns",
      suggestion: "Try grid-cols-3 or repeat(3,minmax(0,1fr)).",
    });
  }

  return diagnostics;
}

function collectColorValueDiagnostics(style: StyleConfig) {
  const diagnostics: StyleDiagnostic[] = [];
  const fields: Array<{ field: "textColor" | "background" | "borderColor"; role: "text" | "background" | "border" }> = [
    { field: "textColor", role: "text" },
    { field: "background", role: "background" },
    { field: "borderColor", role: "border" },
  ];

  fields.forEach(({ field, role }) => {
    const value = style[field];
    if (!hasValue(value) || isValidColorFieldValue(value, role)) return;

    diagnostics.push({
      id: `invalid-color-${field}`,
      severity: "warning",
      title: "Color value may be invalid",
      message: "This value does not look like a Tailwind color utility or a valid CSS color.",
      field,
      suggestion: "Try text-slate-950, bg-white, #ffffff, rgb(...), or var(--color).",
    });
  });

  return diagnostics;
}

function collectDedicatedColorConflicts(style: StyleConfig, customClassTokens: string[]) {
  const diagnostics: StyleDiagnostic[] = [];
  const skipGroupIds = new Set<string>();
  const normalizedCustomTokens = customClassTokens.map(stripVariants);

  if (hasValue(style.textColor) && normalizedCustomTokens.some(isTailwindTextColorClass)) {
    skipGroupIds.add("textColor");
    diagnostics.push({
      id: "dedicated-custom-text-color-conflict",
      severity: "warning",
      title: "Conflicting text color",
      message: "This element has a Text color value and also text color classes in Custom Tailwind classes. One of them may override the other.",
      field: "textColor",
      suggestion: "Keep text color in either the Text color field or Custom Tailwind classes, but not both.",
    });
  }

  if (hasValue(style.background) && normalizedCustomTokens.some(isTailwindBackgroundClass)) {
    skipGroupIds.add("background");
    diagnostics.push({
      id: "dedicated-custom-background-conflict",
      severity: "warning",
      title: "Conflicting background color",
      message: "This element has a Background value and also background classes in Custom Tailwind classes. One of them may override the other.",
      field: "background",
      suggestion: "Keep background styling in either the Background field or Custom Tailwind classes.",
    });
  }

  if (hasValue(style.borderColor) && normalizedCustomTokens.some(isTailwindBorderColorClass)) {
    skipGroupIds.add("borderColor");
    diagnostics.push({
      id: "dedicated-custom-border-color-conflict",
      severity: "warning",
      title: "Conflicting border color",
      message: "This element has a Border color value and also border color classes in Custom Tailwind classes.",
      field: "borderColor",
      suggestion: "Keep border color in either the Border color field or Custom Tailwind classes.",
    });
  }

  return { diagnostics, skipGroupIds };
}

type DedicatedUtilityConflict = {
  field: keyof StyleConfig;
  groupId: string;
  title: string;
  message: string;
  suggestion: string;
  matches: (className: string) => boolean;
};

const dedicatedUtilityConflicts: DedicatedUtilityConflict[] = [
  {
    field: "width",
    groupId: "width",
    title: "Conflicting width values",
    message: "This element has a Width value and also width classes in Custom Tailwind classes. One of them may override the other.",
    suggestion: "Keep width in either the Width field or Custom Tailwind classes.",
    matches: isTailwindWidthClass,
  },
  {
    field: "minWidth",
    groupId: "minWidth",
    title: "Conflicting min-width values",
    message: "This element has a Min width value and also min-width classes in Custom Tailwind classes. One of them may override the other.",
    suggestion: "Keep min-width in either the Min width field or Custom Tailwind classes.",
    matches: isTailwindMinWidthClass,
  },
  {
    field: "maxWidth",
    groupId: "maxWidth",
    title: "Conflicting max-width values",
    message: "This element has a Max width value and also max-width classes in Custom Tailwind classes. One of them may override the other.",
    suggestion: "Keep max-width in either the Max width field or Custom Tailwind classes.",
    matches: isTailwindMaxWidthClass,
  },
  {
    field: "height",
    groupId: "height",
    title: "Conflicting height values",
    message: "This element has a Height value and also height classes in Custom Tailwind classes. One of them may override the other.",
    suggestion: "Keep height in either the Height field or Custom Tailwind classes.",
    matches: isTailwindHeightClass,
  },
  {
    field: "minHeight",
    groupId: "minHeight",
    title: "Conflicting min-height values",
    message: "This element has a Min height value and also min-height classes in Custom Tailwind classes. One of them may override the other.",
    suggestion: "Keep min-height in either the Min height field or Custom Tailwind classes.",
    matches: isTailwindMinHeightClass,
  },
  {
    field: "maxHeight",
    groupId: "maxHeight",
    title: "Conflicting max-height values",
    message: "This element has a Max height value and also max-height classes in Custom Tailwind classes. One of them may override the other.",
    suggestion: "Keep max-height in either the Max height field or Custom Tailwind classes.",
    matches: isTailwindMaxHeightClass,
  },
  {
    field: "padding",
    groupId: "padding",
    title: "Conflicting padding values",
    message: "This element has a Padding value and also padding classes in Custom Tailwind classes. One of them may override the other.",
    suggestion: "Keep padding in either the Padding field or Custom Tailwind classes.",
    matches: isBasePaddingClass,
  },
  {
    field: "paddingX",
    groupId: "paddingX",
    title: "Conflicting horizontal padding values",
    message: "This element has a Padding X value and also horizontal padding classes in Custom Tailwind classes.",
    suggestion: "Keep horizontal padding in either the Padding X field or Custom Tailwind classes.",
    matches: isPaddingXClass,
  },
  {
    field: "paddingY",
    groupId: "paddingY",
    title: "Conflicting vertical padding values",
    message: "This element has a Padding Y value and also vertical padding classes in Custom Tailwind classes.",
    suggestion: "Keep vertical padding in either the Padding Y field or Custom Tailwind classes.",
    matches: isPaddingYClass,
  },
  {
    field: "paddingTop",
    groupId: "paddingTop",
    title: "Conflicting top padding values",
    message: "This element has a Padding top value and also top padding classes in Custom Tailwind classes.",
    suggestion: "Keep top padding in either the Padding top field or Custom Tailwind classes.",
    matches: isPaddingTopClass,
  },
  {
    field: "paddingRight",
    groupId: "paddingRight",
    title: "Conflicting right padding values",
    message: "This element has a Padding right value and also right padding classes in Custom Tailwind classes.",
    suggestion: "Keep right padding in either the Padding right field or Custom Tailwind classes.",
    matches: isPaddingRightClass,
  },
  {
    field: "paddingBottom",
    groupId: "paddingBottom",
    title: "Conflicting bottom padding values",
    message: "This element has a Padding bottom value and also bottom padding classes in Custom Tailwind classes.",
    suggestion: "Keep bottom padding in either the Padding bottom field or Custom Tailwind classes.",
    matches: isPaddingBottomClass,
  },
  {
    field: "paddingLeft",
    groupId: "paddingLeft",
    title: "Conflicting left padding values",
    message: "This element has a Padding left value and also left padding classes in Custom Tailwind classes.",
    suggestion: "Keep left padding in either the Padding left field or Custom Tailwind classes.",
    matches: isPaddingLeftClass,
  },
  {
    field: "margin",
    groupId: "margin",
    title: "Conflicting margin values",
    message: "This element has a Margin value and also margin classes in Custom Tailwind classes. One of them may override the other.",
    suggestion: "Keep margin in either the Margin field or Custom Tailwind classes.",
    matches: isBaseMarginClass,
  },
  {
    field: "marginX",
    groupId: "marginX",
    title: "Conflicting horizontal margin values",
    message: "This element has a Margin X value and also horizontal margin classes in Custom Tailwind classes.",
    suggestion: "Keep horizontal margin in either the Margin X field or Custom Tailwind classes.",
    matches: isMarginXClass,
  },
  {
    field: "marginY",
    groupId: "marginY",
    title: "Conflicting vertical margin values",
    message: "This element has a Margin Y value and also vertical margin classes in Custom Tailwind classes.",
    suggestion: "Keep vertical margin in either the Margin Y field or Custom Tailwind classes.",
    matches: isMarginYClass,
  },
  {
    field: "marginTop",
    groupId: "marginTop",
    title: "Conflicting top margin values",
    message: "This element has a Margin top value and also top margin classes in Custom Tailwind classes.",
    suggestion: "Keep top margin in either the Margin top field or Custom Tailwind classes.",
    matches: isMarginTopClass,
  },
  {
    field: "marginRight",
    groupId: "marginRight",
    title: "Conflicting right margin values",
    message: "This element has a Margin right value and also right margin classes in Custom Tailwind classes.",
    suggestion: "Keep right margin in either the Margin right field or Custom Tailwind classes.",
    matches: isMarginRightClass,
  },
  {
    field: "marginBottom",
    groupId: "marginBottom",
    title: "Conflicting bottom margin values",
    message: "This element has a Margin bottom value and also bottom margin classes in Custom Tailwind classes.",
    suggestion: "Keep bottom margin in either the Margin bottom field or Custom Tailwind classes.",
    matches: isMarginBottomClass,
  },
  {
    field: "marginLeft",
    groupId: "marginLeft",
    title: "Conflicting left margin values",
    message: "This element has a Margin left value and also left margin classes in Custom Tailwind classes.",
    suggestion: "Keep left margin in either the Margin left field or Custom Tailwind classes.",
    matches: isMarginLeftClass,
  },
  {
    field: "gap",
    groupId: "gap",
    title: "Conflicting gap values",
    message: "This element has a Gap value and also gap classes in Custom Tailwind classes. One of them may override the other.",
    suggestion: "Keep gap in either the Gap field or Custom Tailwind classes.",
    matches: isBaseGapClass,
  },
  {
    field: "rowGap",
    groupId: "rowGap",
    title: "Conflicting row gap values",
    message: "This element has a Row gap value and also row gap classes in Custom Tailwind classes.",
    suggestion: "Keep row gap in either the Row gap field or Custom Tailwind classes.",
    matches: isRowGapClass,
  },
  {
    field: "columnGap",
    groupId: "columnGap",
    title: "Conflicting column gap values",
    message: "This element has a Column gap value and also column gap classes in Custom Tailwind classes.",
    suggestion: "Keep column gap in either the Column gap field or Custom Tailwind classes.",
    matches: isColumnGapClass,
  },
];

function collectDedicatedUtilityConflicts(style: StyleConfig, customClassTokens: string[]) {
  const diagnostics: StyleDiagnostic[] = [];
  const skipGroupIds = new Set<string>();
  const normalizedCustomTokens = customClassTokens.map(stripVariants);

  dedicatedUtilityConflicts.forEach((conflict) => {
    const value = style[conflict.field];
    if (typeof value !== "string" || !value.trim()) return;
    if (!normalizedCustomTokens.some(conflict.matches)) return;

    skipGroupIds.add(conflict.groupId);
    diagnostics.push({
      id: `dedicated-custom-${conflict.groupId}-conflict`,
      severity: "warning",
      title: conflict.title,
      message: conflict.message,
      field: conflict.field,
      suggestion: conflict.suggestion,
    });
  });

  return { diagnostics, skipGroupIds };
}

function limitDiagnostics(diagnostics: StyleDiagnostic[]) {
  if (diagnostics.length <= SAFETY_LIMITS.diagnostics) return diagnostics;
  return [
    ...diagnostics.slice(0, SAFETY_LIMITS.diagnostics),
    {
      id: "diagnostics-hidden-for-performance",
      severity: "info" as const,
      title: "More diagnostics were hidden",
      message: "More diagnostics were hidden to keep the editor responsive.",
    },
  ];
}

export function getStyleDiagnostics({
  node,
  parent,
  viewport,
  resolvedStyle,
}: {
  node: ElementNode;
  parent: ElementNode | null;
  viewport: Viewport;
  resolvedStyle: StyleConfig;
}): StyleDiagnostic[] {
  const className = styleConfigToTailwindClasses(getResolvedStyles(node, viewport));
  const classTokens = splitClassName(className);
  const normalizedClassTokens = classTokens.map(stripVariants);
  const diagnostics: StyleDiagnostic[] = [];
  const hasPositionOffset =
    hasValue(resolvedStyle.insetTop) ||
    hasValue(resolvedStyle.insetRight) ||
    hasValue(resolvedStyle.insetBottom) ||
    hasValue(resolvedStyle.insetLeft) ||
    normalizedClassTokens.some((token) => /^-?(?:top|right|bottom|left)-.+/.test(token));

  if (viewport !== "desktop" && node.styles?.[viewport] && Object.keys(node.styles[viewport] ?? {}).length > 0) {
    diagnostics.push({
      id: "viewport-override-active",
      severity: "info",
      title: "Viewport override active",
      message: "You are editing the mobile/tablet layer. Values in this layer override the desktop fallback for this viewport.",
      suggestion: "Switch back to desktop if you want to edit the base style.",
    });
  }

  const customClassTokens = splitClassName(resolvedStyle.customClassName ?? "");
  if ((resolvedStyle.customClassName?.length ?? 0) >= SAFETY_LIMITS.customClassName || customClassTokens.length >= SAFETY_LIMITS.maxClassTokens) {
    diagnostics.push({
      id: "too-many-custom-classes",
      severity: "warning",
      title: "Custom classes were shortened",
      message: "Custom classes were shortened to keep the editor responsive.",
      field: "customClassName",
      suggestion: "Remove unused classes or move repeated styles into fewer utilities.",
    });
  }

  if (node.type === "link" && !node.props?.href?.trim()) {
    diagnostics.push({
      id: "link-without-href",
      severity: "warning",
      title: "Link href may be invalid",
      message: "This link has no destination. Preview and export will use a safe # fallback.",
      suggestion: "Set href to a URL, route, section id, or # placeholder.",
    });
  }

  if (node.type === "link" && isProbablyDangerousUrl(node.props?.href)) {
    diagnostics.push({
      id: "dangerous-link-url",
      severity: "warning",
      title: "Invalid URL was replaced",
      message: "This link uses a blocked URL protocol. Preview and export will use a safe fallback.",
      suggestion: "Use #, a relative path, http(s), mailto, or tel.",
    });
  }

  if (node.type === "image" && isProbablyDangerousUrl(node.props?.src)) {
    diagnostics.push({
      id: "dangerous-image-url",
      severity: "warning",
      title: "Invalid image URL was replaced",
      message: "This image source uses a blocked URL protocol. Preview and export will ignore it.",
      suggestion: "Use http(s), a relative path, or a safe data:image URL.",
    });
  }

  if (node.type === "listItem" && parent?.type !== "list") {
    diagnostics.push({
      id: "list-item-outside-list",
      severity: "info",
      title: "List item outside a list",
      message: "List item is usually used inside a list.",
      suggestion: "Add it inside a List element when you want semantic ul/li markup.",
    });
  }

  if ((node.type === "input" || node.type === "textarea") && parent?.type !== "form") {
    diagnostics.push({
      id: "field-outside-form",
      severity: "info",
      title: "Form field outside a form",
      message: "Inputs can be used anywhere, but wrapping them in a form is recommended.",
    });
  }

  const colorConflicts = collectDedicatedColorConflicts(resolvedStyle, customClassTokens);
  const utilityConflicts = collectDedicatedUtilityConflicts(resolvedStyle, customClassTokens);
  const skippedConflictGroups = new Set([...colorConflicts.skipGroupIds, ...utilityConflicts.skipGroupIds]);
  diagnostics.push(...colorConflicts.diagnostics);
  diagnostics.push(...utilityConflicts.diagnostics);
  diagnostics.push(...collectClassConflicts(classTokens, skippedConflictGroups));

  if (shouldFitFullWidthInsideHorizontalMargins(resolvedStyle)) {
    diagnostics.push({
      id: "full-width-with-horizontal-margin",
      severity: "info",
      title: "Full width with horizontal margin can overflow",
      message: "A full-width element with left or right margin becomes wider than its parent in normal CSS.",
      field: "width",
      suggestion: "MotionForge auto-fits this combination in preview and export, but using parent padding is usually cleaner.",
    });
  }

  if ((!resolvedStyle.position || resolvedStyle.position === "static") && hasPositionOffset) {
    diagnostics.push({
      id: "position-offsets-static",
      severity: "warning",
      title: "Position offsets may not apply",
      message: "top, right, bottom, and left only work on positioned elements.",
      field: "position",
      suggestion: "Set position to relative, absolute, fixed, or sticky.",
    });
  }

  if (resolvedStyle.position === "absolute") {
    const parentPosition = parent ? getResolvedStyles(parent, viewport).position : undefined;
    if (!parentPosition || parentPosition === "static") {
      diagnostics.push({
        id: "absolute-without-positioned-parent",
        severity: "warning",
        title: "Absolute positioning may use an unexpected reference",
        message: "This element is absolute, but its parent is not positioned. It may be positioned relative to a higher ancestor instead.",
        field: "position",
        suggestion: "Set the parent element position to relative.",
      });
    }
  }

  if (resolvedStyle.position === "sticky" && !hasPositionOffset) {
    diagnostics.push({
      id: "sticky-without-offset",
      severity: "info",
      title: "Sticky usually needs an offset",
      message: "Sticky elements usually need top, bottom, or another offset value to visibly stick.",
      field: "position",
      suggestion: "Try setting Top to 0 or top-0.",
    });
  }

  if (resolvedStyle.position === "fixed") {
    diagnostics.push({
      id: "fixed-position-viewport",
      severity: "info",
      title: "Fixed positioning uses the viewport",
      message: "This element is positioned relative to the browser viewport, not the canvas container.",
      field: "position",
    });
  }

  if (resolvedStyle.gridColumns && resolvedStyle.display !== "grid") {
    diagnostics.push({
      id: "grid-columns-without-grid",
      severity: "warning",
      title: "Grid columns will not apply",
      message: "Grid column settings only affect elements with display: grid.",
      field: "gridColumns",
      suggestion: "Set display to grid.",
    });
  }

  if (resolvedStyle.flexDirection && resolvedStyle.display !== "flex") {
    diagnostics.push({
      id: "flex-direction-without-flex",
      severity: "info",
      title: "Flex direction may not apply",
      message: "flex-direction only affects elements with display: flex.",
      field: "display",
      suggestion: "Set display to flex.",
    });
  }

  if (resolvedStyle.display === "block" && (resolvedStyle.justifyContent || resolvedStyle.alignItems)) {
    diagnostics.push({
      id: "alignment-with-block",
      severity: "info",
      title: "Alignment may not affect block layout",
      message: "justify-content and align-items are most useful with flex or grid layouts.",
      field: "display",
      suggestion: "Set display to flex or grid.",
    });
  }

  diagnostics.push(...collectRawValueDiagnostics(resolvedStyle));
  diagnostics.push(...collectColorValueDiagnostics(resolvedStyle));

  return limitDiagnostics(diagnostics);
}
