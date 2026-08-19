"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const motionConfigs = [
  {
      "id": "hero-container",
      "mode": "tween",
      "type": "fade-in",
      "trigger": "page-load",
      "duration": 0.8,
      "delay": 0,
      "ease": "power3.out",
      "stagger": 0,
      "yoyo": false,
      "pin": false,
      "markers": false,
      "flipPreset": "expand",
      "flipAbsolute": false,
      "flipScale": false,
      "flipSimple": false,
      "flipFade": false,
      "from": {
        "opacity": 0
      }
    }
];

export default function MotionForgeHero() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
  
    const cleanups: Array<() => void> = [];
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
      return /^\d+(?:\.\d+)?$/.test(trimmed) ? `+=${trimmed}` : trimmed;
    };

    const resolveScrollTriggerTarget = (config: MotionConfig, target: HTMLElement) => {
      const triggerTargetId = config.triggerTargetId || "self";
      if (triggerTargetId === "self") return target;
      if (triggerTargetId === "parent") return target.parentElement || target;
      if (triggerTargetId === "root" || triggerTargetId === "canvas") {
        return root.querySelector<HTMLElement>(`[data-motion-id="${motionConfigs[0]?.id}"]`) || root;
      }
      return root.querySelector<HTMLElement>(`[data-motion-id="${triggerTargetId}"]`) || target;
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


    const ctx = gsap.context(() => {
      configs.forEach((config) => {
        const target = root.querySelector<HTMLElement>(`[data-motion-id="${config.id}"]`);
        if (!target) return;


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
  }, []);

  return (
    <div ref={rootRef} data-motionforge-root style={{ width: "100%", boxSizing: "border-box", margin: 0, padding: 0 }}>
      <style>{`
  [data-motionforge-root], [data-motionforge-root] * { box-sizing: border-box; }
  [data-motionforge-root] { width: 100%; margin: 0; padding: 0; }
  [data-motion-id="hero-section"] { z-index: 0; }
  [data-motion-id="hero-container"] { align-self: stretch; width: auto; z-index: 10; }

@media (min-width: 768px) {
  [data-motion-id="hero-section"] { z-index: 0; }
  [data-motion-id="hero-container"] { align-self: stretch; width: auto; z-index: 10; }
}

@media (min-width: 1024px) {
  [data-motion-id="hero-section"] { z-index: 0; }
  [data-motion-id="hero-container"] { align-self: stretch; width: auto; z-index: 10; }
}
      `}</style>
      <section className="justify-center items-center relative w-full min-h-screen px-5 py-10 gap-0 rounded-none bg-slate-950 text-white overflow-hidden md:justify-center md:items-center md:relative md:w-full md:min-h-screen md:px-8 md:py-12 md:gap-0 md:rounded-none md:bg-slate-950 md:text-white md:overflow-hidden lg:justify-center lg:items-center lg:relative lg:w-full lg:min-h-screen lg:gap-0 lg:rounded-none lg:bg-slate-950 lg:text-white lg:overflow-hidden" data-motion-id="hero-section">
        <div className="flex flex-col justify-center items-center relative w-full p-4 m-5 gap-6 rounded-2xl bg-white/10 text-white overflow-hidden md:flex md:flex-col md:justify-center md:items-center md:relative md:max-w-3xl md:p-6 md:m-5 md:gap-8 md:rounded-2xl md:bg-white/10 md:text-white md:overflow-hidden lg:grid lg:grid-cols-2 lg:justify-center lg:items-center lg:relative lg:p-10 lg:m-5 lg:gap-8 lg:rounded-2xl lg:bg-white/10 lg:text-white lg:overflow-hidden" data-motion-id="hero-container">

        </div>
      </section>
    </div>
  );
}
