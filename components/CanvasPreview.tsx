"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationConfig, ElementNode, Viewport } from "@/lib/types";
import { findParentNode, flattenTree } from "@/lib/treeUtils";
import { getResolvedStyles, styleConfigToInlineStyle, styleConfigToTailwindClasses } from "@/lib/styleUtils";
import { viewportPresets } from "@/lib/viewportPresets";

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

function tweenVarsFromConfig(animation: AnimationConfig) {
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
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return `+=${trimmed}`;
  return trimmed;
}

function scrollEndFromConfig(animation: AnimationConfig) {
  return animation.scrollEnd || normalizeScrollDistance(animation.scrollDistance) || "bottom top";
}

function scrollTriggerFromConfig(animation: AnimationConfig, trigger: Element, scroller: Element) {
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
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (/^\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (/^\d+(?:\.\d+)?px$/.test(trimmed)) return Number.parseFloat(trimmed);
  if (/^\d+(?:\.\d+)?vh$/.test(trimmed)) return (Number.parseFloat(trimmed) / 100) * viewportHeight;

  return null;
}

function getLargestScrollSceneHeight(tree: ElementNode, viewportHeight: number) {
  return flattenTree(tree).reduce((largest, node) => {
    const animation = node.animation;
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

function PreviewNode({
  node,
  viewport,
  selectedId,
  isRoot,
  onSelect,
}: {
  node: ElementNode;
  viewport: Viewport;
  selectedId: string;
  isRoot?: boolean;
  onSelect: (id: string) => void;
}) {
  const Tag = node.type === "section" ? "section" : node.type === "heading" ? "h1" : node.type === "paragraph" ? "p" : node.type === "button" ? "button" : "div";
  const isSelected = selectedId === node.id;
  const resolvedStyle = getResolvedStyles(node, viewport);
  const className = styleConfigToTailwindClasses(resolvedStyle);
  const inlineStyle = styleConfigToInlineStyle(resolvedStyle);
  const previewStyle = isRoot ? { width: "100%", minHeight: "100%", ...inlineStyle } : inlineStyle;
  const selectedClass = isSelected ? "outline outline-2 outline-offset-2 outline-cyan-400" : "outline outline-1 outline-transparent hover:outline-cyan-200";

  return (
    <Tag
      className={`${className} ${selectedClass} transition-[outline-color]`}
      style={previewStyle}
      data-motion-id={node.id}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(node.id);
      }}
    >
      {node.type === "image" ? <VisualBlock /> : node.props.text}
      {node.children.map((child) => (
        <PreviewNode key={child.id} node={child} viewport={viewport} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </Tag>
  );
}

export function CanvasPreview({ tree, viewport, selectedId, onSelect }: { tree: ElementNode; viewport: Viewport; selectedId: string; onSelect: (id: string) => void }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasScrollerRef = useRef<HTMLDivElement | null>(null);
  const frameAreaRef = useRef<HTMLDivElement | null>(null);
  const [frameAreaSize, setFrameAreaSize] = useState({ width: 0, height: 0 });
  const preset = viewportPresets[viewport];
  const selectedNode = useMemo(() => flattenTree(tree).find((node) => node.id === selectedId) ?? null, [selectedId, tree]);
  const selectedAnimation = selectedNode?.animation;
  const scrollSceneHeight = useMemo(() => getLargestScrollSceneHeight(tree, preset.height), [preset.height, tree]);
  const scrollSceneSpacerHeight = Math.max(0, scrollSceneHeight - preset.height);
  const canPreviewFlip =
    selectedAnimation?.mode === "flip" &&
    selectedAnimation.flipPreset !== "swap" &&
    selectedAnimation.flipPreset !== "reorder" &&
    selectedAnimation.flipPreset !== "none";
  const scale = useMemo(() => {
    if (!frameAreaSize.width || !frameAreaSize.height) return 1;
    return Math.min(frameAreaSize.width / preset.width, frameAreaSize.height / preset.height, 1);
  }, [frameAreaSize.height, frameAreaSize.width, preset.height, preset.width]);
  const scaledWidth = preset.width * scale;
  const scaledHeight = preset.height * scale;
  const zoomPercent = Math.round(scale * 100);

  useEffect(() => {
    const frameArea = frameAreaRef.current;
    if (!frameArea) return;

    const updateFrameAreaSize = () => {
      setFrameAreaSize({
        width: frameArea.clientWidth,
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
        const animation = node.animation;
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

          gsap.from(target, {
            ...from,
            ...baseTweenVars,
            scrollTrigger: scrollTriggerFromConfig(animation, trigger, canvasScroller),
          });
        } else if (animation.trigger === "hover") {
          const onEnter = () => gsap.fromTo(target, from, toVars);
          target.addEventListener("mouseenter", onEnter);
          listeners.push(() => target.removeEventListener("mouseenter", onEnter));
        } else {
          gsap.from(target, { ...from, ...baseTweenVars });
        }
      });
      window.requestAnimationFrame(() => ScrollTrigger.refresh());
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
  };

  return (
    <main data-testid="canvas-preview" className="min-w-0 flex-1 overflow-auto bg-slate-100 p-6 motionforge-scrollbar">
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
      <div ref={frameAreaRef} className="flex min-h-[calc(100vh-8rem)] min-w-0 items-start justify-center overflow-hidden p-2">
        <div
          className="min-w-0"
          style={{
            width: scaledWidth,
            height: scaledHeight,
          }}
        >
          <div
            data-testid="canvas-frame"
            data-viewport={viewport}
            className="overflow-hidden rounded-[1.5rem] border border-slate-300 bg-white shadow-canvas"
            style={{
              width: preset.width,
              height: preset.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div
              ref={canvasScrollerRef}
              className="relative bg-white motionforge-scrollbar"
              style={{
                width: `${preset.width}px`,
                height: `${preset.height}px`,
                overflowY: "auto",
                overflowX: "hidden",
                overscrollBehavior: "contain",
              }}
            >
              <div ref={rootRef} className="relative bg-white" style={{ width: "100%" }}>
                <PreviewNode node={tree} viewport={viewport} selectedId={selectedId} isRoot onSelect={onSelect} />
                {scrollSceneSpacerHeight > 0 && <div aria-hidden="true" style={{ height: `${scrollSceneSpacerHeight}px` }} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
