"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationConfig, ElementNode, Viewport } from "@/lib/types";
import { canHaveChildren, findParentNode, flattenTree } from "@/lib/treeUtils";
import { getResolvedStyles, shouldFitFullWidthInsideHorizontalMargins, styleConfigToInlineStyle, styleConfigToTailwindClasses } from "@/lib/styleUtils";
import { viewportPresets } from "@/lib/viewportPresets";
import { clampString, safeAnimationConfig, safeButtonType, safeChildren, safeElementType, safeFormMethod, safeHeadingLevel, safeInputType, safeListType, safeRows, safeSceneHeightPixels, safeScrollValue, safeUrl, SAFETY_LIMITS, textContentMaxLengthForType } from "@/lib/safety";

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

function tweenVarsFromConfig(animation: AnimationConfig) {
  animation = safeAnimationConfig(animation);
  return {
    duration: animation.duration,
    delay: animation.delay,
    ease: animation.ease,
    stagger: animation.stagger || undefined,
    repeat: animation.repeat ?? undefined,
    yoyo: animation.yoyo || undefined,
    transformOrigin: animation.transformOrigin || undefined,
  };
}

function normalizeScrollDistance(value: string | undefined) {
  return value?.trim() ? safeScrollValue(value) : undefined;
}

function scrollEndFromConfig(animation: AnimationConfig) {
  animation = safeAnimationConfig(animation);
  return animation.scrollEnd || normalizeScrollDistance(animation.scrollDistance) || "bottom top";
}

function scrollTriggerFromConfig(animation: AnimationConfig, trigger: Element, scroller: Element) {
  animation = safeAnimationConfig(animation);
  return {
    trigger,
    scroller,
    start: animation.scrollStart || "top 80%",
    end: scrollEndFromConfig(animation),
    scrub: animation.scrub === undefined || animation.scrub === false ? undefined : animation.scrub,
    pin: animation.pin || undefined,
    markers: animation.markers
      ? {
          startColor: "#0891b2",
          endColor: "#f59e0b",
          fontSize: "11px",
          indent: 8,
        }
      : undefined,
    once: animation.once ?? animation.trigger === "scroll-enter",
    toggleActions: animation.toggleActions || "play none none none",
  };
}

function isScrollAnimation(animation: AnimationConfig) {
  return animation.mode === "scroll" || animation.trigger === "scroll-enter";
}

function sceneHeightToPixels(value: string | undefined, viewportHeight: number) {
  return safeSceneHeightPixels(value, viewportHeight);
}

function getLargestScrollSceneHeight(tree: ElementNode, viewportHeight: number) {
  return flattenTree(tree).reduce((largest, node) => {
    const animation = node.animation ? safeAnimationConfig(node.animation) : undefined;
    if (!animation || !isScrollAnimation(animation)) return largest;
    const sceneHeight = sceneHeightToPixels(animation.scrollSceneHeight, viewportHeight);
    return sceneHeight ? Math.max(largest, sceneHeight) : largest;
  }, viewportHeight);
}

function getMotionElement(root: Element, id: string) {
  return root.querySelector<HTMLElement>(`[data-motion-id="${id}"]`);
}

function resolveScrollTriggerElement({
  animation,
  animatedNode,
  rootElement,
  scroller,
  tree,
  target,
}: {
  animation: AnimationConfig;
  animatedNode: ElementNode;
  rootElement: HTMLElement;
  scroller: HTMLElement;
  tree: ElementNode;
  target: HTMLElement;
}) {
  const triggerTargetId = animation.triggerTargetId ?? "self";

  if (triggerTargetId === "self") return target;
  if (triggerTargetId === "canvas") return scroller;
  if (triggerTargetId === "root") return getMotionElement(rootElement, tree.id) ?? target;
  if (triggerTargetId === "parent") {
    const parent = findParentNode(tree, animatedNode.id);
    return parent ? getMotionElement(rootElement, parent.id) ?? target : target;
  }

  return getMotionElement(rootElement, triggerTargetId) ?? target;
}

function flipOptionsFromConfig(animation: AnimationConfig) {
  animation = safeAnimationConfig(animation);
  return {
    duration: animation.duration,
    ease: animation.ease,
    absolute: animation.flipAbsolute || undefined,
    scale: animation.flipScale,
    simple: animation.flipSimple || undefined,
    fade: animation.flipFade || undefined,
    props: animation.flipProps || undefined,
  };
}

function applyFlipPreviewState(target: HTMLElement, preset: AnimationConfig["flipPreset"]) {
  if (preset === "card-pop") {
    target.style.transform = "scale(1.08) translateY(-8px)";
    target.style.boxShadow = "0 24px 70px rgba(15, 23, 42, 0.28)";
    target.style.zIndex = "50";
    return;
  }

  target.style.transform = "scale(1.06)";
  target.style.zIndex = "40";
}

function VisualBlock() {
  return (
    <>
      <div className="mb-5 h-28 w-full rounded-2xl bg-white/25 p-4 backdrop-blur">
        <div className="mb-4 h-3 w-1/2 rounded-full bg-white/70" />
        <div className="grid h-16 grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/30" />
          <div className="rounded-xl bg-white/50" />
          <div className="rounded-xl bg-white/30" />
        </div>
      </div>
      <p className="text-sm font-semibold text-white/90">Responsive visual block</p>
    </>
  );
}

function renderTextWithLineBreaks(text: string) {
  if (!text.includes("\n")) return text;

  return text.split("\n").flatMap((line, index) => (index === 0 ? [line] : [<br key={`line-break-${index}`} />, line]));
}

type ElementDragStart = {
  event: ReactPointerEvent<HTMLElement>;
  node: ElementNode;
  isRoot: boolean;
};

type FlowAxis = "horizontal" | "horizontal-reverse" | "vertical" | "vertical-reverse" | "grid";

type SiblingRect = {
  id: string;
  rect: DOMRect;
};

type DropPlacement = {
  parentId: string;
  index: number;
};

function axisForParent(parent: ElementNode, viewport: Viewport, parentElement?: HTMLElement): FlowAxis {
  if (parentElement) {
    const computedStyle = window.getComputedStyle(parentElement);
    if (computedStyle.display === "grid" || computedStyle.display === "inline-grid") return "grid";
    if (computedStyle.display === "flex" || computedStyle.display === "inline-flex") {
      if (computedStyle.flexWrap !== "nowrap") return "grid";
      if (computedStyle.flexDirection === "row") return "horizontal";
      if (computedStyle.flexDirection === "row-reverse") return "horizontal-reverse";
      if (computedStyle.flexDirection === "column-reverse") return "vertical-reverse";
      return "vertical";
    }
  }

  const parentStyle = getResolvedStyles(parent, viewport);
  if (parentStyle.display === "grid") return "grid";
  if (parentStyle.display === "flex" && parentStyle.flexDirection === "row") return "horizontal";
  return "vertical";
}

function insertionIndexForAxis(siblings: SiblingRect[], point: { x: number; y: number }, axis: FlowAxis) {
  if (axis === "horizontal" || axis === "horizontal-reverse") {
    if (axis === "horizontal-reverse") {
      const nextIndex = siblings.findIndex(({ rect }) => point.x > rect.left + rect.width / 2);
      return nextIndex < 0 ? siblings.length : nextIndex;
    }

    const nextIndex = siblings.findIndex(({ rect }) => point.x < rect.left + rect.width / 2);
    return nextIndex < 0 ? siblings.length : nextIndex;
  }

  if (axis === "vertical" || axis === "vertical-reverse") {
    if (axis === "vertical-reverse") {
      const nextIndex = siblings.findIndex(({ rect }) => point.y > rect.top + rect.height / 2);
      return nextIndex < 0 ? siblings.length : nextIndex;
    }

    const nextIndex = siblings.findIndex(({ rect }) => point.y < rect.top + rect.height / 2);
    return nextIndex < 0 ? siblings.length : nextIndex;
  }

  const rows = siblings.reduce<Array<{ top: number; bottom: number; items: SiblingRect[] }>>((nextRows, item) => {
    const centerY = item.rect.top + item.rect.height / 2;
    const row = nextRows.find((candidate) => centerY >= candidate.top - 8 && centerY <= candidate.bottom + 8);
    if (row) {
      row.top = Math.min(row.top, item.rect.top);
      row.bottom = Math.max(row.bottom, item.rect.bottom);
      row.items.push(item);
      return nextRows;
    }

    nextRows.push({ top: item.rect.top, bottom: item.rect.bottom, items: [item] });
    return nextRows;
  }, []);

  let skippedItems = 0;
  for (const row of rows) {
    const rowCenter = row.top + (row.bottom - row.top) / 2;
    const sortedRow = [...row.items].sort((a, b) => a.rect.left - b.rect.left);
    if (point.y <= rowCenter) {
      const rowIndex = sortedRow.findIndex(({ rect }) => point.x < rect.left + rect.width / 2);
      return skippedItems + (rowIndex < 0 ? sortedRow.length : rowIndex);
    }
    skippedItems += sortedRow.length;
  }

  return siblings.length;
}

function dropPlacementAtPoint({
  tree,
  draggedNode,
  viewport,
  rootElement,
  point,
}: {
  tree: ElementNode;
  draggedNode: ElementNode;
  viewport: Viewport;
  rootElement: HTMLElement;
  point: { x: number; y: number };
}): DropPlacement | null {
  const nodes = flattenTree(tree);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const blockedIds = new Set(flattenTree(draggedNode).map((node) => node.id));
  let targetParent: ElementNode | null = null;
  let targetParentElement: HTMLElement | null = null;

  for (const hitElement of document.elementsFromPoint(point.x, point.y)) {
    let motionElement = hitElement.closest<HTMLElement>("[data-motion-id]");

    while (motionElement && rootElement.contains(motionElement)) {
      const candidate = nodeById.get(motionElement.dataset.motionId ?? "");
      if (candidate && !blockedIds.has(candidate.id) && canHaveChildren(candidate)) {
        targetParent = candidate;
        targetParentElement = motionElement;
        break;
      }
      motionElement = motionElement.parentElement?.closest<HTMLElement>("[data-motion-id]") ?? null;
    }

    if (targetParent && targetParentElement) break;
  }

  if (!targetParent || !targetParentElement) return null;

  const siblings = safeChildren(targetParent)
    .filter((child) => child.id !== draggedNode.id)
    .map((child) => {
      const childElement = getMotionElement(targetParentElement!, child.id);
      return childElement ? { id: child.id, rect: childElement.getBoundingClientRect() } : null;
    })
    .filter((item): item is SiblingRect => Boolean(item));
  const axis = axisForParent(targetParent, viewport, targetParentElement);

  return {
    parentId: targetParent.id,
    index: insertionIndexForAxis(siblings, point, axis),
  };
}

const previewTagForType = {
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
} as const;

const headingTagForLevel = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
  5: "h5",
  6: "h6",
} as const;

function PreviewNode({
  node,
  viewport,
  selectedId,
  draggingId,
  dropPlacement,
  isRoot,
  onSelect,
  onDragStart,
  depth = 0,
  visited = new Set<string>(),
}: {
  node: ElementNode;
  viewport: Viewport;
  selectedId: string;
  draggingId: string | null;
  dropPlacement: DropPlacement | null;
  isRoot?: boolean;
  onSelect: (id: string) => void;
  onDragStart: (dragStart: ElementDragStart) => void;
  depth?: number;
  visited?: Set<string>;
}) {
  if (depth > SAFETY_LIMITS.treeDepth) {
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Preview reached the safe tree depth limit.</div>;
  }

  if (node.id && visited.has(node.id)) {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">Preview could not render this element safely.</div>;
  }

  const nextVisited = new Set(visited);
  if (node.id) nextVisited.add(node.id);
  const safeType = safeElementType(node.type);
  const Tag = safeType === "unknown" ? "div" : previewTagForType[safeType];
  const isSelected = selectedId === node.id;
  const isDropTarget = dropPlacement?.parentId === node.id;
  const resolvedStyle = getResolvedStyles(node, viewport);
  const className = styleConfigToTailwindClasses(resolvedStyle);
  const inlineStyle = styleConfigToInlineStyle(resolvedStyle);
  const widthFitStyle = shouldFitFullWidthInsideHorizontalMargins(resolvedStyle) ? { alignSelf: "stretch" as const, width: "auto" as const } : {};
  const previewStyle = isRoot ? { minHeight: "100%", ...inlineStyle, ...widthFitStyle } : { ...inlineStyle, ...widthFitStyle };
  const selectedClass = isSelected ? "outline outline-2 outline-offset-[-2px] outline-cyan-400" : "outline outline-1 outline-offset-[-1px] outline-transparent hover:outline-cyan-200";
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onSelect(node.id);
  };
  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    event.stopPropagation();
    onSelect(node.id);
    onDragStart({ event, node, isRoot: Boolean(isRoot) });
  };
  const commonProps = {
    className: `${className} ${selectedClass} ${isRoot ? "" : draggingId === node.id ? "cursor-grabbing" : "cursor-grab active:cursor-grabbing"} ${isDropTarget ? "ring-2 ring-inset ring-amber-300" : ""} transition-[outline-color,box-shadow]`,
    style: { boxSizing: "border-box" as const, ...previewStyle },
    "data-motion-id": node.id,
    "data-drop-target": isDropTarget ? "true" : undefined,
    "data-drop-index": isDropTarget ? dropPlacement.index : undefined,
    onClick: handleClick,
    onPointerDown: handlePointerDown,
  };
  const props = node.props ?? {};
  const renderedChildren = safeChildren(node).map((child, index) => (
    <PreviewNode key={`${child.id ?? "missing"}-${index}`} node={child} viewport={viewport} selectedId={selectedId} draggingId={draggingId} dropPlacement={dropPlacement} onSelect={onSelect} onDragStart={onDragStart} depth={depth + 1} visited={nextVisited} />
  ));
  const textContent = renderTextWithLineBreaks(clampString(props.text, textContentMaxLengthForType(node.type)));

  if (safeType === "image") {
    const src = safeUrl(props.src, "");
    const alt = clampString(props.alt, SAFETY_LIMITS.altText);
    if (src) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img {...commonProps} src={src} alt={alt} />;
    }

    return (
      <div {...commonProps} role="img" aria-label={alt || undefined}>
        <VisualBlock />
        {renderedChildren}
      </div>
    );
  }

  if (safeType === "link") {
    const target = props.target === "_blank" ? "_blank" : "_self";
    return (
      <a
        {...commonProps}
        href={safeUrl(props.href, "#")}
        target={target}
        rel={target === "_blank" ? "noreferrer" : undefined}
        onClick={(event) => {
          event.preventDefault();
          handleClick(event);
        }}
      >
        {textContent}
        {renderedChildren}
      </a>
    );
  }

  if (safeType === "form") {
    const action = safeUrl(props.action, "");
    return (
      <form {...commonProps} action={action || undefined} method={safeFormMethod(props.method)} onSubmit={(event) => event.preventDefault()}>
        {textContent}
        {renderedChildren}
      </form>
    );
  }

  if (safeType === "label") {
    return (
      <label {...commonProps} htmlFor={clampString(props.htmlFor, SAFETY_LIMITS.elementName) || undefined}>
        {textContent}
      </label>
    );
  }

  if (safeType === "input") {
    const inputType = safeInputType(props.inputType);
    const inputValue = clampString(props.value, SAFETY_LIMITS.shortText);
    const isCheckable = inputType === "checkbox" || inputType === "radio";
    const inputKey = `${node.id}:${inputType}:${inputValue}:${props.checked ? "checked" : "unchecked"}`;

    if (isCheckable) {
      return (
        <input
          key={inputKey}
          {...commonProps}
          type={inputType}
          name={clampString(props.name, SAFETY_LIMITS.elementName) || undefined}
          value={inputValue || undefined}
          defaultChecked={props.checked === undefined ? undefined : Boolean(props.checked)}
        />
      );
    }

    return (
      <input
        key={inputKey}
        {...commonProps}
        type={inputType}
        name={clampString(props.name, SAFETY_LIMITS.elementName) || undefined}
        placeholder={clampString(props.placeholder, SAFETY_LIMITS.placeholder) || undefined}
        value={inputValue}
        readOnly
      />
    );
  }

  if (safeType === "textarea") {
    return <textarea {...commonProps} name={clampString(props.name, SAFETY_LIMITS.elementName) || undefined} placeholder={clampString(props.placeholder, SAFETY_LIMITS.placeholder) || undefined} rows={safeRows(props.rows)} value={clampString(props.value ?? props.text, SAFETY_LIMITS.shortText)} readOnly />;
  }

  if (safeType === "button") {
    return (
      <button {...commonProps} type={safeButtonType(props.buttonType)}>
        {textContent}
        {renderedChildren}
      </button>
    );
  }

  if (safeType === "heading") {
    const HeadingTag = headingTagForLevel[safeHeadingLevel(props.headingLevel)];
    return (
      <HeadingTag {...commonProps}>
        {textContent}
        {renderedChildren}
      </HeadingTag>
    );
  }

  if (safeType === "list") {
    const ListTag = safeListType(props.listType) === "ordered" ? "ol" : "ul";
    return <ListTag {...commonProps}>{renderedChildren}</ListTag>;
  }

  return (
    <Tag {...commonProps}>
      {textContent}
      {renderedChildren}
    </Tag>
  );
}

export function CanvasPreview({
  tree,
  viewport,
  selectedId,
  onSelect,
  onMoveElement,
}: {
  tree: ElementNode;
  viewport: Viewport;
  selectedId: string;
  onSelect: (id: string) => void;
  onMoveElement: (id: string, targetParentId: string, targetIndex: number) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasScrollerRef = useRef<HTMLDivElement | null>(null);
  const frameAreaRef = useRef<HTMLDivElement | null>(null);
  const [frameAreaSize, setFrameAreaSize] = useState({ width: 0, height: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropPlacement, setDropPlacement] = useState<DropPlacement | null>(null);
  const preset = viewportPresets[viewport];
  const selectedNode = useMemo(() => flattenTree(tree).find((node) => node.id === selectedId) ?? null, [selectedId, tree]);
  const selectedAnimation = selectedNode?.animation ? safeAnimationConfig(selectedNode.animation) : undefined;
  const scrollSceneHeight = useMemo(() => getLargestScrollSceneHeight(tree, preset.height), [preset.height, tree]);
  const scrollSceneSpacerHeight = Math.max(0, scrollSceneHeight - preset.height);
  const canPreviewFlip =
    selectedAnimation?.mode === "flip" &&
    selectedAnimation.flipPreset !== "swap" &&
    selectedAnimation.flipPreset !== "reorder" &&
    selectedAnimation.flipPreset !== "none";
  const scale = useMemo(() => {
    if (!frameAreaSize.width) return 1;
    return Math.min(frameAreaSize.width / preset.width, 1);
  }, [frameAreaSize.width, preset.width]);
  const scaledWidth = preset.width * scale;
  const scaledHeight = preset.height * scale;
  const zoomPercent = Math.round(scale * 100);
  const canvasViewportStyle = {
    "--motionforge-viewport-width": `${preset.width}px`,
    "--motionforge-viewport-height": `${preset.height}px`,
    width: `${preset.width}px`,
    height: `${preset.height}px`,
    overflowY: "auto",
    overflowX: "hidden",
    overscrollBehavior: "contain",
  } as CSSProperties;

  useEffect(() => {
    const frameArea = frameAreaRef.current;
    if (!frameArea) return;

    const updateFrameAreaSize = () => {
      const frameAreaStyle = window.getComputedStyle(frameArea);
      const horizontalPadding = Number.parseFloat(frameAreaStyle.paddingLeft) + Number.parseFloat(frameAreaStyle.paddingRight);

      setFrameAreaSize({
        width: Math.max(0, frameArea.clientWidth - horizontalPadding),
        height: frameArea.clientHeight,
      });
    };

    updateFrameAreaSize();

    const resizeObserver = new ResizeObserver(updateFrameAreaSize);
    resizeObserver.observe(frameArea);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvasScroller = canvasScrollerRef.current;
    if (!root || !canvasScroller) return;

    gsap.registerPlugin(ScrollTrigger, Flip);
    const listeners: Array<() => void> = [];
    const ctx = gsap.context(() => {
      flattenTree(tree).forEach((node) => {
        const animation = node.animation ? safeAnimationConfig(node.animation) : undefined;
        if (!animation || animation.mode === "flip") return;
        const target = getMotionElement(root, node.id);
        const from = animationFromConfig(animation);
        if (!target || !from) return;

        const baseTweenVars = tweenVarsFromConfig(animation);
        const toVars = {
          opacity: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          filter: "blur(0px)",
          ...baseTweenVars,
        };

        if (isScrollAnimation(animation)) {
          const trigger = resolveScrollTriggerElement({
            animation,
            animatedNode: node,
            rootElement: root,
            scroller: canvasScroller,
            tree,
            target,
          });

          try {
            gsap.from(target, {
              ...from,
              ...baseTweenVars,
              scrollTrigger: scrollTriggerFromConfig(animation, trigger, canvasScroller),
            });
          } catch {
            return;
          }
        } else if (animation.trigger === "hover") {
          const onEnter = () => {
            try {
              gsap.fromTo(target, from, toVars);
            } catch {
              // Ignore malformed animation state for this node.
            }
          };
          target.addEventListener("mouseenter", onEnter);
          listeners.push(() => target.removeEventListener("mouseenter", onEnter));
        } else {
          try {
            gsap.from(target, { ...from, ...baseTweenVars });
          } catch {
            return;
          }
        }
      });
      window.requestAnimationFrame(() => {
        try {
          ScrollTrigger.refresh();
        } catch {
          // Keep preview alive if ScrollTrigger rejects malformed editor state.
        }
      });
    }, root);

    return () => {
      listeners.forEach((dispose) => dispose());
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.scroller === canvasScroller) trigger.kill(true);
      });
      ctx.revert();
    };
  }, [tree, viewport, scrollSceneHeight]);

  useEffect(() => {
    if (canvasScrollerRef.current) canvasScrollerRef.current.scrollTop = 0;
  }, [viewport]);

  const handlePreviewFlip = () => {
    const animation = selectedAnimation;
    const target = selectedNode && rootRef.current ? getMotionElement(rootRef.current, selectedNode.id) : null;
    if (!animation || !target || animation.mode !== "flip" || !canPreviewFlip) return;

    const original = {
      transform: target.style.transform,
      boxShadow: target.style.boxShadow,
      zIndex: target.style.zIndex,
    };
    const state = Flip.getState(target);

    applyFlipPreviewState(target, animation.flipPreset ?? "expand");
    try {
      Flip.from(state, {
        ...flipOptionsFromConfig(animation),
        onComplete: () => {
          window.setTimeout(() => {
            const resetState = Flip.getState(target);
            target.style.transform = original.transform;
            target.style.boxShadow = original.boxShadow;
            target.style.zIndex = original.zIndex;
            Flip.from(resetState, {
              duration: Math.min(animation.duration || 0.5, 0.4),
              ease: animation.ease || "power2.out",
              absolute: animation.flipAbsolute || undefined,
              scale: animation.flipScale,
              simple: animation.flipSimple || undefined,
              fade: animation.flipFade || undefined,
              props: animation.flipProps || undefined,
            });
          }, 180);
        },
      });
    } catch {
      target.style.transform = original.transform;
      target.style.boxShadow = original.boxShadow;
      target.style.zIndex = original.zIndex;
    }
  };

  const handleDragStart = ({ event, node, isRoot }: ElementDragStart) => {
    if (isRoot || event.button !== 0) return;

    event.preventDefault();

    const target = event.currentTarget;
    const parentNode = findParentNode(tree, node.id);
    const rootElement = rootRef.current;
    if (!parentNode || !rootElement) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const movementScale = scale || 1;
    const originalInlineTransform = target.style.transform;
    const originalInlineZIndex = target.style.zIndex;
    const originalInlineOpacity = target.style.opacity;
    const originalInlinePointerEvents = target.style.pointerEvents;
    let didDrag = false;
    let currentDropPlacement: DropPlacement | null = null;

    target.setPointerCapture(event.pointerId);
    setDraggingId(node.id);
    target.style.zIndex = "1000";
    target.style.opacity = "0.75";

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / movementScale;
      const deltaY = (moveEvent.clientY - startY) / movementScale;
      if (!didDrag && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 3) return;

      didDrag = true;
      target.style.pointerEvents = "none";
      target.style.transform = `${originalInlineTransform ? `${originalInlineTransform} ` : ""}translate3d(${deltaX}px, ${deltaY}px, 0)`;
      const nextDropPlacement = dropPlacementAtPoint({
        tree,
        draggedNode: node,
        viewport,
        rootElement,
        point: { x: moveEvent.clientX, y: moveEvent.clientY },
      });
      currentDropPlacement = nextDropPlacement;
      setDropPlacement((current) =>
        current?.parentId === nextDropPlacement?.parentId && current?.index === nextDropPlacement?.index ? current : nextDropPlacement,
      );
    };

    const finishDrag = () => {
      if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      setDraggingId(null);
      setDropPlacement(null);
      target.style.transform = originalInlineTransform;
      target.style.zIndex = originalInlineZIndex;
      target.style.opacity = originalInlineOpacity;
      target.style.pointerEvents = originalInlinePointerEvents;
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (didDrag) {
        currentDropPlacement = dropPlacementAtPoint({
          tree,
          draggedNode: node,
          viewport,
          rootElement,
          point: { x: upEvent.clientX, y: upEvent.clientY },
        });
      }

      finishDrag();

      if (!didDrag || !currentDropPlacement) return;

      onMoveElement(node.id, currentDropPlacement.parentId, currentDropPlacement.index);
    };

    const handlePointerCancel = () => {
      finishDrag();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
  };

  return (
    <main data-testid="canvas-preview" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100 p-6">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
        <span>Canvas preview</span>
        <div className="flex items-center gap-2">
          {selectedAnimation?.mode === "flip" && (
            <button
              type="button"
              onClick={handlePreviewFlip}
              disabled={!canPreviewFlip}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              title={canPreviewFlip ? "Run Flip preview once" : "Swap/reorder Flip previews require multi-element layout editing."}
            >
              Preview Flip
            </button>
          )}
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">
            {preset.label} {"\u00b7"} {preset.description} {"\u00b7"} {zoomPercent}%
          </span>
        </div>
      </div>
      <div ref={frameAreaRef} className="flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-auto p-2 motionforge-scrollbar">
        <div
          className="shrink-0"
          style={{
            width: scaledWidth,
            height: scaledHeight,
          }}
        >
          <div
            style={{
              width: preset.width,
              height: preset.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div
              data-testid="canvas-frame"
              data-viewport={viewport}
              className="overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white shadow-canvas"
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              <div ref={canvasScrollerRef} className="motionforge-canvas-viewport relative bg-white motionforge-scrollbar" style={canvasViewportStyle}>
                <div ref={rootRef} className="relative bg-white" style={{ width: "100%" }}>
                  <PreviewNode node={tree} viewport={viewport} selectedId={selectedId} draggingId={draggingId} dropPlacement={dropPlacement} isRoot onSelect={onSelect} onDragStart={handleDragStart} />
                  {scrollSceneSpacerHeight > 0 && <div aria-hidden="true" style={{ height: `${scrollSceneSpacerHeight}px` }} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
