import type { AnimationConfig, ElementNode, Viewport } from "./types";
import { flattenTree } from "./treeUtils";
import { getResolvedStyles, styleConfigToTailwindClasses } from "./styleUtils";

function escapeText(value = "") {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(value = "") {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
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

function responsiveClassName(node: ElementNode) {
  const mobile = styleConfigToTailwindClasses(getResolvedStyles(node, "mobile"));
  const tablet = prefixClasses(styleConfigToTailwindClasses(getResolvedStyles(node, "tablet")), "md");
  const desktop = prefixClasses(styleConfigToTailwindClasses(getResolvedStyles(node, "desktop")), "lg");
  return [mobile, tablet, desktop].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function tagForType(type: ElementNode["type"]) {
  const tags: Record<ElementNode["type"], string> = {
    section: "section",
    div: "div",
    heading: "h1",
    paragraph: "p",
    button: "button",
    image: "div",
  };
  return tags[type];
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

export function renderElementNode(node: ElementNode, viewport: Viewport = "desktop", level = 0): string {
  const tag = tagForType(node.type);
  const className = escapeAttribute(styleConfigToTailwindClasses(getResolvedStyles(node, viewport)));
  const attrs = `className="${className}" data-motion-id="${node.id}"`;
  const children = node.children.map((child) => renderElementNode(child, viewport, level + 1)).join("\n");

  if (node.type === "image") {
    const inner = [renderVisualBlock(level + 1), children].filter(Boolean).join("\n");
    return `${indent(level)}<${tag} ${attrs}>\n${inner}\n${indent(level)}</${tag}>`;
  }

  const text = escapeText(node.props.text);
  const inner = [text ? `${indent(level + 1)}${text}` : "", children].filter(Boolean).join("\n");

  if (!inner) return `${indent(level)}<${tag} ${attrs} />`;
  return `${indent(level)}<${tag} ${attrs}>\n${inner}\n${indent(level)}</${tag}>`;
}

function renderExportNode(node: ElementNode, level = 2): string {
  const tag = tagForType(node.type);
  const className = escapeAttribute(responsiveClassName(node));
  const attrs = `className="${className}" data-motion-id="${node.id}"`;
  const children = node.children.map((child) => renderExportNode(child, level + 1)).join("\n");

  if (node.type === "image") {
    const inner = [renderVisualBlock(level + 1), children].filter(Boolean).join("\n");
    return `${indent(level)}<${tag} ${attrs}>\n${inner}\n${indent(level)}</${tag}>`;
  }

  const text = escapeText(node.props.text);
  const inner = [text ? `${indent(level + 1)}${text}` : "", children].filter(Boolean).join("\n");
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
  return animation.mode === "scroll" || animation.trigger === "scroll-enter";
}

function usesFlip(animation: AnimationConfig) {
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
    const animation = node.animation!;
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
  const configs = motionConfigs as MotionConfig[];

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
          ...config.from,
          ...baseTweenVars,
          scrollTrigger: scrollTriggerVars(config, triggerTarget),
        });
      } else if (config.trigger === "hover") {
        const onEnter = () => gsap.fromTo(target, config.from, toVars);
        target.addEventListener("mouseenter", onEnter);
        cleanups.push(() => target.removeEventListener("mouseenter", onEnter));
      } else {
        gsap.from(target, { ...config.from, ...baseTweenVars });
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
    <div ref={rootRef}>
${renderExportNode(tree, 3)}
    </div>
  );
}
`;
}
