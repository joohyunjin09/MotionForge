import type { ElementNode, StyleConfig, Viewport } from "./types";
import { getResolvedStyles, styleConfigToTailwindClasses } from "./styleUtils";

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
const textColorPattern = /^text-(?:white|(?:slate|cyan|blue|red|green|zinc|neutral|stone)-[\w./[\]%-]+)$/;
const textAlignClasses = new Set(["text-left", "text-center", "text-right", "text-justify"]);
const textTransformClasses = new Set(["normal-case", "uppercase", "lowercase", "capitalize"]);
const objectFitClasses = new Set(["object-contain", "object-cover", "object-fill", "object-none", "object-scale-down"]);
const objectPositionClasses = new Set(["object-center", "object-top", "object-bottom", "object-left", "object-right"]);
const whiteSpaceClasses = new Set(["whitespace-normal", "whitespace-nowrap", "whitespace-pre-line", "whitespace-pre-wrap"]);

const conflictGroups: ConflictGroup[] = [
  {
    id: "width",
    label: "width",
    field: "width",
    matches: (className) => /^(?:w-auto|w-full|w-fit|w-1\/2|w-1\/3|w-2\/3|w-\[.+\])$/.test(className),
  },
  {
    id: "maxWidth",
    label: "max-width",
    field: "maxWidth",
    matches: (className) => /^max-w-.+/.test(className),
  },
  {
    id: "minHeight",
    label: "min-height",
    field: "minHeight",
    matches: (className) => /^min-h-.+/.test(className),
  },
  {
    id: "height",
    label: "height",
    field: "height",
    matches: (className) => /^h-.+/.test(className),
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
    matches: (className) => textColorPattern.test(className),
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
    matches: (className) => /^bg-.+/.test(className),
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

const rawValueFields: Array<{ field: keyof StyleConfig; prefix: string }> = [
  { field: "maxWidth", prefix: "max-w" },
  { field: "minHeight", prefix: "min-h" },
  { field: "height", prefix: "h" },
  { field: "insetTop", prefix: "top" },
  { field: "insetRight", prefix: "right" },
  { field: "insetBottom", prefix: "bottom" },
  { field: "insetLeft", prefix: "left" },
];

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function splitClassName(className: string) {
  const tokens: string[] = [];
  let current = "";
  let bracketDepth = 0;

  for (const char of className) {
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

function classConflictDiagnostic(group: ConflictGroup, classes: string[]): StyleDiagnostic {
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

function collectClassConflicts(tokens: string[]) {
  const diagnostics: StyleDiagnostic[] = [];
  const normalizedTokens = tokens.map(stripVariants);

  conflictGroups.forEach((group) => {
    const matches = Array.from(new Set(normalizedTokens.filter(group.matches)));
    if (matches.length > 1) diagnostics.push(classConflictDiagnostic(group, matches));
  });

  return diagnostics;
}

function isTailwindUtilityValue(value: string, prefix: string) {
  return value.startsWith(`${prefix}-`) || value.startsWith(`-${prefix}-`);
}

function isCssLengthValue(value: string) {
  return /^-?(?:0|(?:\d+|\d*\.\d+)(?:px|rem|vh|vw|%|em))$/.test(value);
}

function isCssFunctionValue(value: string) {
  return /^(?:calc|clamp|min|max)\(.+\)$/.test(value);
}

function isValidAdvancedValue(value: string, prefix: string) {
  const trimmed = value.trim();
  return trimmed === "auto" || isTailwindUtilityValue(trimmed, prefix) || isCssLengthValue(trimmed) || isCssFunctionValue(trimmed);
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

  rawValueFields.forEach(({ field, prefix }) => {
    const value = style[field];
    if (typeof value !== "string" || !value.trim()) return;
    if (isValidAdvancedValue(value, prefix)) return;

    diagnostics.push({
      id: `invalid-value-${field}`,
      severity: "warning",
      title: "Value may be invalid",
      message: "This value does not look like a Tailwind utility or a valid CSS length. It may not apply.",
      field,
      suggestion: "Use a Tailwind utility like max-w-6xl or a CSS value like 1200px.",
    });
  });

  if (style.gridColumns && !isValidGridColumnsValue(style.gridColumns)) {
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

  if (viewport !== "desktop" && node.styles[viewport] && Object.keys(node.styles[viewport] ?? {}).length > 0) {
    diagnostics.push({
      id: "viewport-override-active",
      severity: "info",
      title: "Viewport override active",
      message: "You are editing the mobile/tablet layer. Values in this layer override the desktop fallback for this viewport.",
      suggestion: "Switch back to desktop if you want to edit the base style.",
    });
  }

  diagnostics.push(...collectClassConflicts(classTokens));

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

  return diagnostics;
}
