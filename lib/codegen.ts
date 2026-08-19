import type { AnimationConfig, ElementNode, Viewport } from "./types";
import { flattenTree } from "./treeUtils";
import { getResolvedStyles, shouldFitFullWidthInsideHorizontalMargins, styleConfigToInlineStyle, styleConfigToTailwindClasses } from "./styleUtils";
import { clampString, safeAnimationConfig, safeButtonType, safeChildren, safeElementType, safeFormMethod, safeHeadingLevel, safeInputType, safeListType, safeRows, safeUrl, SAFETY_LIMITS, textContentMaxLengthForType } from "./safety";

function escapeAttribute(value = "") {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeJsString(value = "") {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
}

function indent(level: number) {
  return "  ".repeat(level);
}

function prefixClasses(className: string, prefix: string) {
  return className
    .split(" ")
    .filter(Boolean)
    .map((token) => `${prefix}:${token}`)
    .join(" ");
}

function textAlignResetClasses(node: ElementNode) {
  const mobile = getResolvedStyles(node, "mobile");
  const tablet = getResolvedStyles(node, "tablet");
  const desktop = getResolvedStyles(node, "desktop");
  const resets: string[] = [];

  if (mobile.textAlign && !tablet.textAlign) resets.push("md:text-left");
  if ((mobile.textAlign || tablet.textAlign) && !desktop.textAlign) resets.push("lg:text-left");

  return resets.join(" ");
}

function responsiveClassName(node: ElementNode) {
  const mobile = styleConfigToTailwindClasses(getResolvedStyles(node, "mobile"));
  const tablet = prefixClasses(styleConfigToTailwindClasses(getResolvedStyles(node, "tablet")), "md");
  const desktop = prefixClasses(styleConfigToTailwindClasses(getResolvedStyles(node, "desktop")), "lg");
  return [mobile, tablet, desktop, textAlignResetClasses(node)].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function tagForNode(node: ElementNode) {
  const safeType = safeElementType(node.type);
  if (safeType === "unknown") return "div";

  if (safeType === "heading") return `h${safeHeadingLevel(node.props?.headingLevel)}`;
  if (safeType === "list") return safeListType(node.props?.listType) === "ordered" ? "ol" : "ul";
  if (safeType === "image" && safeUrl(node.props?.src, "")) return "img";

  const tags: Record<Exclude<ReturnType<typeof safeElementType>, "unknown">, string> = {
    section: "section",
    div: "div",
    header: "header",
    main: "main",
    footer: "footer",
    nav: "nav",
    article: "article",
    aside: "aside",
    heading: "h1",
    paragraph: "p",
    span: "span",
    link: "a",
    button: "button",
    image: "div",
    list: "ul",
    listItem: "li",
    form: "form",
    label: "label",
    input: "input",
    textarea: "textarea",
  };
  return tags[safeType];
}

function stringAttribute(name: string, value?: string) {
  const trimmed = value?.trim();
  return trimmed ? `${name}="${escapeAttribute(trimmed)}"` : "";
}

function placeholderAttribute(value?: string) {
  const safeValue = clampString(value, SAFETY_LIMITS.placeholder);
  return safeValue ? `placeholder="${escapeAttribute(safeValue)}"` : "";
}

function numberAttribute(name: string, value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? `${name}={${value}}` : "";
}

function booleanAttribute(name: string, value?: boolean) {
  return value ? `${name}={true}` : "";
}

function styleAttribute(style: ReturnType<typeof styleConfigToInlineStyle>) {
  const entries = Object.entries(style).filter((entry): entry is [string, string | number] => entry[1] !== undefined && entry[1] !== "");
  if (entries.length === 0) return "";

  const body = entries
    .map(([property, value]) => `${property}: ${typeof value === "number" ? value : `"${escapeJsString(value)}"`}`)
    .join(", ");

  return `style={{ ${body} }}`;
}

function escapeCssString(value = "") {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\A ");
}

function escapeTemplateLiteral(value = "") {
  return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

function cssPropertyName(property: string) {
  return property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function cssValue(value: string | number) {
  return typeof value === "number" ? String(value) : value;
}

function cssDeclarationBlock(style: ReturnType<typeof styleConfigToInlineStyle>) {
  return Object.entries(style)
    .filter((entry): entry is [string, string | number] => entry[1] !== undefined && entry[1] !== "")
    .map(([property, value]) => `${cssPropertyName(property)}: ${cssValue(value)};`)
    .join(" ");
}

function responsiveStyleSheet(tree: ElementNode) {
  const nodes = flattenTree(tree);
  const baseRules = [
    "[data-motionforge-root], [data-motionforge-root] * { box-sizing: border-box; }",
    "[data-motionforge-root] { width: 100%; margin: 0; padding: 0; }",
  ].join("\n");
  const viewportRules: Array<{ viewport: Viewport; media?: string }> = [
    { viewport: "mobile" },
    { viewport: "tablet", media: "@media (min-width: 768px)" },
    { viewport: "desktop", media: "@media (min-width: 1024px)" },
  ];

  const responsiveRules = viewportRules
    .map(({ viewport, media }) => {
      const rules = nodes
        .map((node) => {
          const resolvedStyle = getResolvedStyles(node, viewport);
          const inlineStyle = styleConfigToInlineStyle(resolvedStyle);
          const declarations = cssDeclarationBlock({
            ...inlineStyle,
            ...(shouldFitFullWidthInsideHorizontalMargins(resolvedStyle) ? { alignSelf: "stretch", width: "auto" } : {}),
          });
          if (!declarations) return "";
          return `  [data-motion-id="${escapeCssString(node.id)}"] { ${declarations} }`;
        })
        .filter(Boolean);

      if (rules.length === 0) return "";
      if (!media) return rules.join("\n");
      return `${media} {\n${rules.join("\n")}\n}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return [baseRules, responsiveRules].filter(Boolean).join("\n\n");
}

function typeSpecificAttributes(node: ElementNode) {
  const props = node.props ?? {};
  switch (safeElementType(node.type)) {
    case "link": {
      const target = props.target === "_blank" ? "_blank" : props.target === "_self" ? "_self" : undefined;
      return [stringAttribute("href", safeUrl(props.href, "#")), stringAttribute("target", target), target === "_blank" ? "rel=\"noreferrer\"" : ""];
    }
    case "button":
      return [stringAttribute("type", safeButtonType(props.buttonType))];
    case "image": {
      const src = safeUrl(props.src, "");
      const alt = clampString(props.alt, SAFETY_LIMITS.altText);
      return src ? [stringAttribute("src", src), stringAttribute("alt", alt)] : [stringAttribute("role", "img"), stringAttribute("aria-label", alt)];
    }
    case "form":
      return [stringAttribute("method", safeFormMethod(props.method)), stringAttribute("action", safeUrl(props.action, ""))];
    case "label":
      return [stringAttribute("htmlFor", clampString(props.htmlFor, SAFETY_LIMITS.elementName))];
    case "input": {
      const inputType = safeInputType(props.inputType);
      const isCheckable = inputType === "checkbox" || inputType === "radio";
      return [
        stringAttribute("type", safeInputType(props.inputType)),
        isCheckable ? "" : placeholderAttribute(props.placeholder),
        stringAttribute("name", clampString(props.name, SAFETY_LIMITS.elementName)),
        stringAttribute(isCheckable ? "value" : "defaultValue", clampString(props.value, SAFETY_LIMITS.shortText)),
        isCheckable ? booleanAttribute("defaultChecked", props.checked) : "",
      ];
    }
    case "textarea":
      return [
        placeholderAttribute(props.placeholder),
        stringAttribute("name", clampString(props.name, SAFETY_LIMITS.elementName)),
        numberAttribute("rows", safeRows(props.rows)),
        stringAttribute("defaultValue", clampString(props.value ?? props.text, SAFETY_LIMITS.shortText)),
      ];
    default:
      return [];
  }
}

function attributesForNode(node: ElementNode, className: string, style: Parameters<typeof styleConfigToInlineStyle>[0] = {}, includeStyle = true) {
  return [`className="${escapeAttribute(className)}"`, includeStyle ? styleAttribute(styleConfigToInlineStyle(style)) : "", `data-motion-id="${escapeAttribute(node.id)}"`, ...typeSpecificAttributes(node)].filter(Boolean).join(" ");
}

function jsxTextExpression(value: string) {
  return `{"${escapeJsString(value)}"}`;
}

function textLinesForNode(node: ElementNode, level: number) {
  const type = safeElementType(node.type);
  const text = type === "textarea" || type === "input" ? "" : clampString(node.props?.text, textContentMaxLengthForType(node.type));
  if (!text) return "";

  return text
    .split("\n")
    .flatMap((line, index) => {
      const lines: string[] = [];
      if (index > 0) lines.push(`${indent(level + 1)}<br />`);
      if (line) lines.push(`${indent(level + 1)}${jsxTextExpression(line)}`);
      return lines;
    })
    .join("\n");
}

function textAndChildrenForNode(node: ElementNode, children: string, level: number) {
  return [textLinesForNode(node, level), children].filter(Boolean).join("\n");
}

function renderVisualBlock(level: number) {
  return [
    `${indent(level)}<div className="mb-6 h-32 w-full rounded-2xl bg-white/25 p-4 backdrop-blur">`,
    `${indent(level + 1)}<div className="mb-4 h-3 w-1/2 rounded-full bg-white/70" />`,
    `${indent(level + 1)}<div className="grid h-20 grid-cols-3 gap-3">`,
    `${indent(level + 2)}<div className="rounded-xl bg-white/30" />`,
    `${indent(level + 2)}<div className="rounded-xl bg-white/50" />`,
    `${indent(level + 2)}<div className="rounded-xl bg-white/30" />`,
    `${indent(level + 1)}</div>`,
    `${indent(level)}</div>`,
    `${indent(level)}<p className="text-sm font-semibold text-white/90">Responsive visual block</p>`,
  ].join("\n");
}

export function renderElementNode(node: ElementNode, viewport: Viewport = "desktop", level = 0, visited = new Set<string>()): string {
  if (level > SAFETY_LIMITS.treeDepth) return `${indent(level)}{/* Maximum tree depth reached. */}`;
  if (node.id && visited.has(node.id)) return `${indent(level)}{/* Invalid tree cycle detected. */}`;
  const nextVisited = new Set(visited);
  if (node.id) nextVisited.add(node.id);
  const safeType = safeElementType(node.type);
  const tag = tagForNode(node);
  const resolvedStyle = getResolvedStyles(node, viewport);
  const className = styleConfigToTailwindClasses(resolvedStyle);
  const attrs = attributesForNode(node, className, resolvedStyle);
  const children = safeChildren(node).map((child) => renderElementNode(child, viewport, level + 1, nextVisited)).join("\n");

  if (safeType === "input" || safeType === "textarea" || tag === "img") return `${indent(level)}<${tag} ${attrs} />`;

  if (safeType === "image") {
    const inner = [renderVisualBlock(level + 1), children].filter(Boolean).join("\n");
    return `${indent(level)}<${tag} ${attrs}>\n${inner}\n${indent(level)}</${tag}>`;
  }

  const inner = textAndChildrenForNode(node, children, level);

  return `${indent(level)}<${tag} ${attrs}>\n${inner}\n${indent(level)}</${tag}>`;
}

function renderExportNode(node: ElementNode, level = 2, visited = new Set<string>()): string {
  if (level > SAFETY_LIMITS.treeDepth) return `${indent(level)}{/* Maximum tree depth reached. */}`;
  if (node.id && visited.has(node.id)) return `${indent(level)}{/* Invalid tree cycle detected. */}`;
  const nextVisited = new Set(visited);
  if (node.id) nextVisited.add(node.id);
  const safeType = safeElementType(node.type);
  const tag = tagForNode(node);
  const className = responsiveClassName(node);
  const attrs = attributesForNode(node, className, {}, false);
  const children = safeChildren(node).map((child) => renderExportNode(child, level + 1, nextVisited)).join("\n");

  if (safeType === "input" || safeType === "textarea" || tag === "img") return `${indent(level)}<${tag} ${attrs} />`;

  if (safeType === "image") {
    const inner = [renderVisualBlock(level + 1), children].filter(Boolean).join("\n");
    return `${indent(level)}<${tag} ${attrs}>\n${inner}\n${indent(level)}</${tag}>`;
  }

  const inner = textAndChildrenForNode(node, children, level);
  return `${indent(level)}<${tag} ${attrs}>\n${inner}\n${indent(level)}</${tag}>`;
}

function presetFromConfig(animation: AnimationConfig) {
  switch (animation.type) {
    case "fade-in":
      return { opacity: 0 };
    case "slide-up":
      return { opacity: 0, y: 32 };
    case "slide-left":
      return { opacity: 0, x: 32 };
    case "scale-in":
      return { opacity: 0, scale: 0.92 };
    case "blur-in":
      return { opacity: 0, filter: "blur(16px)" };
    default:
      return null;
  }
}

function hasNumber(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value);
}

function animationFromConfig(animation: AnimationConfig) {
  animation = safeAnimationConfig(animation);
  const from = { ...(presetFromConfig(animation) ?? {}) } as Record<string, number | string>;

  if (hasNumber(animation.x)) from.x = animation.x!;
  if (hasNumber(animation.y)) from.y = animation.y!;
  if (hasNumber(animation.rotate)) from.rotate = animation.rotate!;
  if (hasNumber(animation.scale)) from.scale = animation.scale!;
  if (hasNumber(animation.opacity)) from.opacity = animation.opacity!;
  if (hasNumber(animation.blur)) from.filter = `blur(${animation.blur}px)`;

  return Object.keys(from).length > 0 ? from : null;
}

function usesScrollTrigger(animation: AnimationConfig) {
  animation = safeAnimationConfig(animation);
  return animation.mode === "scroll" || animation.trigger === "scroll-enter";
}

function usesFlip(animation: AnimationConfig) {
  animation = safeAnimationConfig(animation);
  return animation.mode === "flip";
}

function isAnimatedNode(node: ElementNode) {
  const animation = node.animation;
  if (!animation) return false;
  if (usesFlip(animation)) return true;
  return animation.type !== "none" || animationFromConfig(animation) !== null;
}

export function generateGSAPCode(tree: ElementNode): string {
  const animated = flattenTree(tree).filter(isAnimatedNode);
  const needsScrollTrigger = animated.some((node) => node.animation && usesScrollTrigger(node.animation));
  const needsFlip = animated.some((node) => node.animation && usesFlip(node.animation));
  const pluginRegistration = [needsScrollTrigger ? "ScrollTrigger" : "", needsFlip ? "Flip" : ""].filter(Boolean).join(", ");
  const configs = animated.map((node) => {
    const animation = safeAnimationConfig(node.animation);
    return {
      id: node.id,
      ...animation,
      mode: animation.mode ?? "tween",
      from: animationFromConfig(animation),
    };
  });
  const flipHelpers = needsFlip
    ? `
  type FlipOriginalStyle = { transform: string; boxShadow: string; zIndex: string };

  const flipVars = (config: MotionConfig) => ({
    duration: config.duration,
    ease: config.ease,
    absolute: config.flipAbsolute || undefined,
    scale: config.flipScale,
    simple: config.flipSimple || undefined,
    fade: config.flipFade || undefined,
    props: config.flipProps || undefined,
  });

  const applyFlipState = (target: HTMLElement, config: MotionConfig, original: FlipOriginalStyle) => {
    const active = target.dataset.motionFlipActive === "true";
    target.dataset.motionFlipActive = active ? "false" : "true";

    if (active) {
      target.style.transform = original.transform;
      target.style.boxShadow = original.boxShadow;
      target.style.zIndex = original.zIndex;
      return;
    }

    if (config.flipPreset === "card-pop") {
      target.style.transform = "scale(1.08) translateY(-8px)";
      target.style.boxShadow = "0 24px 70px rgba(15, 23, 42, 0.28)";
      target.style.zIndex = "50";
      return;
    }

    target.style.transform = "scale(1.06)";
    target.style.zIndex = "40";
  };
`
    : "";
  const flipBranch = needsFlip
    ? `
      if (config.mode === "flip") {
        // Flip needs an explicit state change. This export uses click as a small starter interaction.
        if (config.flipPreset === "none" || config.flipPreset === "swap" || config.flipPreset === "reorder") return;

        const original = {
          transform: target.style.transform,
          boxShadow: target.style.boxShadow,
          zIndex: target.style.zIndex,
        };
        const runFlip = () => {
          const state = Flip.getState(target);
          applyFlipState(target, config, original);
          Flip.from(state, flipVars(config));
        };

        target.addEventListener("click", runFlip);
        cleanups.push(() => {
          target.removeEventListener("click", runFlip);
          target.style.transform = original.transform;
          target.style.boxShadow = original.boxShadow;
          target.style.zIndex = original.zIndex;
          delete target.dataset.motionFlipActive;
        });
        return;
      }
`
    : "";

  return `const motionConfigs = ${JSON.stringify(configs, null, 2)};

useEffect(() => {
  const root = rootRef.current;
  if (!root) return;

${pluginRegistration ? `  gsap.registerPlugin(${pluginRegistration});\n` : ""}  const cleanups: Array<() => void> = [];
  type MotionConfig = {
    id: string;
    mode?: "tween" | "scroll" | "flip";
    type?: string;
    trigger?: string;
    duration?: number;
    delay?: number;
    ease?: string;
    stagger?: number;
    repeat?: number;
    yoyo?: boolean;
    transformOrigin?: string;
    triggerTargetId?: string;
    interactionTargetId?: string;
    scrollStart?: string;
    scrollEnd?: string;
    scrollDistance?: string;
    scrollSceneHeight?: string;
    scrub?: boolean | number;
    pin?: boolean;
    markers?: boolean;
    once?: boolean;
    toggleActions?: string;
    flipPreset?: "none" | "expand" | "swap" | "reorder" | "card-pop";
    flipAbsolute?: boolean;
    flipScale?: boolean;
    flipSimple?: boolean;
    flipFade?: boolean;
    flipProps?: string;
    from?: Record<string, number | string> | null;
  };
  const configs = motionConfigs as unknown as MotionConfig[];

  const tweenVars = (config: MotionConfig) => ({
    duration: config.duration,
    delay: config.delay,
    ease: config.ease,
    stagger: config.stagger || undefined,
    repeat: config.repeat ?? undefined,
    yoyo: config.yoyo || undefined,
    transformOrigin: config.transformOrigin || undefined,
  });

  const normalizeScrollEnd = (value?: string) => {
    const trimmed = value?.trim();
    if (!trimmed) return undefined;
    return /^\\d+(?:\\.\\d+)?$/.test(trimmed) ? \`+=\${trimmed}\` : trimmed;
  };

  const resolveScrollTriggerTarget = (config: MotionConfig, target: HTMLElement) => {
    const triggerTargetId = config.triggerTargetId || "self";
    if (triggerTargetId === "self") return target;
    if (triggerTargetId === "parent") return target.parentElement || target;
    if (triggerTargetId === "root" || triggerTargetId === "canvas") {
      return root.querySelector<HTMLElement>(\`[data-motion-id="\${motionConfigs[0]?.id}"]\`) || root;
    }
    return root.querySelector<HTMLElement>(\`[data-motion-id="\${triggerTargetId}"]\`) || target;
  };

  // MotionForge preview uses the canvas as a custom scroller. Exported code uses page scroll by default.
  const scrollTriggerVars = (config: MotionConfig, target: Element) => ({
    trigger: target,
    start: config.scrollStart || "top 80%",
    end: config.scrollEnd || normalizeScrollEnd(config.scrollDistance) || "bottom top",
    scrub: config.scrub === undefined || config.scrub === false ? undefined : config.scrub,
    pin: config.pin || undefined,
    markers: config.markers || undefined,
    once: config.once ?? (config.trigger === "scroll-enter"),
    toggleActions: config.toggleActions || "play none none none",
  });
${flipHelpers}

  const ctx = gsap.context(() => {
    configs.forEach((config) => {
      const target = root.querySelector<HTMLElement>(\`[data-motion-id="\${config.id}"]\`);
      if (!target) return;
${flipBranch}

      if (!config.from) return;
      const fromVars = config.from;

      const baseTweenVars = tweenVars(config);
      const toVars = {
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        filter: "blur(0px)",
        ...baseTweenVars,
      };

      if (config.mode === "scroll" || config.trigger === "scroll-enter") {
        const triggerTarget = resolveScrollTriggerTarget(config, target);
        gsap.from(target, {
          ...fromVars,
          ...baseTweenVars,
          scrollTrigger: scrollTriggerVars(config, triggerTarget),
        });
      } else if (config.trigger === "hover") {
        const onEnter = () => gsap.fromTo(target, fromVars, toVars);
        target.addEventListener("mouseenter", onEnter);
        cleanups.push(() => target.removeEventListener("mouseenter", onEnter));
      } else {
        gsap.from(target, { ...fromVars, ...baseTweenVars });
      }
    });
  }, root);

  return () => {
    cleanups.forEach((dispose) => dispose());
    ctx.revert();
  };
}, []);`;
}

export function generateReactCode(tree: ElementNode): string {
  const animated = flattenTree(tree).filter(isAnimatedNode);
  const needsScrollTrigger = animated.some((node) => node.animation && usesScrollTrigger(node.animation));
  const needsFlip = animated.some((node) => node.animation && usesFlip(node.animation));
  const exportedStyles = responsiveStyleSheet(tree);
  const imports = [
    "\"use client\";",
    "",
    "import { useEffect, useRef } from \"react\";",
    "import { gsap } from \"gsap\";",
    needsScrollTrigger ? "import { ScrollTrigger } from \"gsap/ScrollTrigger\";" : "",
    needsFlip ? "import { Flip } from \"gsap/Flip\";" : "",
  ].filter(Boolean).join("\n");

  return `${imports}

export function MotionForgeHero() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  ${generateGSAPCode(tree).replace(/\n/g, "\n  ")}

  return (
    <div ref={rootRef} data-motionforge-root style={{ width: "100%", boxSizing: "border-box", margin: 0, padding: 0 }}>
${exportedStyles ? `      <style>{\`\n${escapeTemplateLiteral(exportedStyles)}\n      \`}</style>\n` : ""}${renderExportNode(tree, 3)}
    </div>
  );
}
`;
}
