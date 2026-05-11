"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationConfig, ElementNode, Viewport } from "@/lib/types";
import { flattenTree } from "@/lib/treeUtils";
import { getResolvedStyles, styleConfigToTailwindClasses } from "@/lib/styleUtils";

const viewportWidths: Record<Viewport, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 390,
};

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

function VisualBlock() {
  return (
    <>
      <div className="mb-6 h-32 w-full rounded-2xl bg-white/25 p-4 backdrop-blur">
        <div className="mb-4 h-3 w-1/2 rounded-full bg-white/70" />
        <div className="grid h-20 grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/30" />
          <div className="rounded-xl bg-white/50" />
          <div className="rounded-xl bg-white/30" />
        </div>
      </div>
      <p className="text-sm font-semibold text-white/90">Responsive visual block</p>
    </>
  );
}

function PreviewNode({ node, viewport, selectedId, onSelect }: { node: ElementNode; viewport: Viewport; selectedId: string; onSelect: (id: string) => void }) {
  const Tag = node.type === "section" ? "section" : node.type === "heading" ? "h1" : node.type === "paragraph" ? "p" : node.type === "button" ? "button" : "div";
  const isSelected = selectedId === node.id;
  const className = styleConfigToTailwindClasses(getResolvedStyles(node, viewport));
  const selectedClass = isSelected ? "outline outline-2 outline-offset-2 outline-cyan-400" : "outline outline-1 outline-transparent hover:outline-cyan-200";

  return (
    <Tag
      className={`${className} ${selectedClass} transition-[outline-color]`}
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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    gsap.registerPlugin(ScrollTrigger);
    const listeners: Array<() => void> = [];
    const ctx = gsap.context(() => {
      flattenTree(tree).forEach((node) => {
        const animation = node.animation;
        if (!animation || animation.type === "none") return;
        const target = root.querySelector(`[data-motion-id="${node.id}"]`);
        const from = animationFromConfig(animation);
        if (!target || !from) return;

        const toVars = {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: animation.duration,
          delay: animation.delay,
          ease: animation.ease,
          stagger: animation.stagger || undefined,
        };

        if (animation.trigger === "scroll-enter") {
          gsap.from(target, {
            ...from,
            duration: animation.duration,
            delay: animation.delay,
            ease: animation.ease,
            stagger: animation.stagger || undefined,
            scrollTrigger: { trigger: target, start: "top 85%", once: true },
          });
        } else if (animation.trigger === "hover") {
          const onEnter = () => gsap.fromTo(target, from, toVars);
          target.addEventListener("mouseenter", onEnter);
          listeners.push(() => target.removeEventListener("mouseenter", onEnter));
        } else {
          gsap.from(target, {
            ...from,
            duration: animation.duration,
            delay: animation.delay,
            ease: animation.ease,
            stagger: animation.stagger || undefined,
          });
        }
      });
    }, root);

    return () => {
      listeners.forEach((dispose) => dispose());
      ctx.revert();
    };
  }, [tree, viewport]);

  return (
    <main className="flex-1 overflow-auto bg-slate-100 p-8 motionforge-scrollbar">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
        <span>Canvas preview</span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">{viewportWidths[viewport]}px</span>
      </div>
      <div className="flex min-h-[calc(100vh-9rem)] justify-center">
        <div ref={rootRef} className="h-fit max-w-full overflow-auto rounded-[2rem] bg-white shadow-canvas motionforge-scrollbar" style={{ width: viewportWidths[viewport] }}>
          <PreviewNode node={tree} viewport={viewport} selectedId={selectedId} onSelect={onSelect} />
        </div>
      </div>
    </main>
  );
}
