import type { AnimationConfig, ElementNode, Viewport } from "./types";
import { flattenTree } from "./treeUtils";
import { getResolvedStyles, styleConfigToTailwindClasses } from "./styleUtils";

function escapeText(value = "") {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
  const className = styleConfigToTailwindClasses(getResolvedStyles(node, viewport));
  const attrs = `className="${className}" data-motion-id="${node.id}"`;

  if (node.type === "image") {
    return `${indent(level)}<${tag} ${attrs}>\n${renderVisualBlock(level + 1)}\n${indent(level)}</${tag}>`;
  }

  const text = escapeText(node.props.text);
  const children = node.children.map((child) => renderElementNode(child, viewport, level + 1)).join("\n");
  const inner = [text ? `${indent(level + 1)}${text}` : "", children].filter(Boolean).join("\n");

  if (!inner) return `${indent(level)}<${tag} ${attrs} />`;
  return `${indent(level)}<${tag} ${attrs}>\n${inner}\n${indent(level)}</${tag}>`;
}

function renderExportNode(node: ElementNode, level = 2): string {
  const tag = tagForType(node.type);
  const className = responsiveClassName(node);
  const attrs = `className="${className}" data-motion-id="${node.id}"`;

  if (node.type === "image") {
    return `${indent(level)}<${tag} ${attrs}>\n${renderVisualBlock(level + 1)}\n${indent(level)}</${tag}>`;
  }

  const text = escapeText(node.props.text);
  const children = node.children.map((child) => renderExportNode(child, level + 1)).join("\n");
  const inner = [text ? `${indent(level + 1)}${text}` : "", children].filter(Boolean).join("\n");
  return `${indent(level)}<${tag} ${attrs}>\n${inner}\n${indent(level)}</${tag}>`;
}

function animationFromConfig(animation: AnimationConfig) {
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

export function generateGSAPCode(tree: ElementNode): string {
  const animated = flattenTree(tree).filter((node) => node.animation && node.animation.type !== "none");
  const usesScrollTrigger = animated.some((node) => node.animation?.trigger === "scroll-enter");
  const configs = animated.map((node) => ({ id: node.id, ...node.animation, from: animationFromConfig(node.animation!) }));

  return `const motionConfigs = ${JSON.stringify(configs, null, 2)};

useEffect(() => {
  const root = rootRef.current;
  if (!root) return;

${usesScrollTrigger ? "  gsap.registerPlugin(ScrollTrigger);\n" : ""}  const ctx = gsap.context(() => {
    motionConfigs.forEach((config) => {
      const target = root.querySelector(\`[data-motion-id="\${config.id}"]\`);
      if (!target || !config.from) return;

      const tweenVars = {
        ...config.from,
        duration: config.duration,
        delay: config.delay,
        ease: config.ease,
        stagger: config.stagger || undefined,
      };

      if (config.trigger === "scroll-enter") {
        gsap.from(target, {
          ...tweenVars,
          scrollTrigger: { trigger: target, start: "top 80%", once: true },
        });
      } else if (config.trigger === "hover") {
        const onEnter = () => gsap.fromTo(target, config.from, { opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)", duration: config.duration, ease: config.ease });
        target.addEventListener("mouseenter", onEnter);
      } else {
        gsap.from(target, tweenVars);
      }
    });
  }, root);

  return () => ctx.revert();
}, []);`;
}

export function generateReactCode(tree: ElementNode): string {
  const usesScrollTrigger = flattenTree(tree).some((node) => node.animation?.trigger === "scroll-enter" && node.animation.type !== "none");
  const imports = [
    "\"use client\";",
    "",
    "import { useEffect, useRef } from \"react\";",
    "import { gsap } from \"gsap\";",
    usesScrollTrigger ? "import { ScrollTrigger } from \"gsap/ScrollTrigger\";" : "",
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
