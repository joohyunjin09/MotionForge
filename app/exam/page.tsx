"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function MotionForgeHero() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const motionConfigs = [
    {
      "id": "hero-container",
      "type": "fade-in",
      "trigger": "page-load",
      "duration": 0.8,
      "delay": 0,
      "ease": "power3.out",
      "stagger": 0,
      "from": {
        "opacity": 0
      }
    },
    {
      "id": "text-column",
      "type": "slide-up",
      "trigger": "page-load",
      "duration": 0.8,
      "delay": 0,
      "ease": "power3.out",
      "stagger": 0.08,
      "from": {
        "opacity": 0,
        "y": 32
      }
    },
    {
      "id": "hero-heading",
      "type": "slide-up",
      "trigger": "page-load",
      "duration": 0.8,
      "delay": 0.1,
      "ease": "power3.out",
      "stagger": 0,
      "from": {
        "opacity": 0,
        "y": 32
      }
    },
    {
      "id": "hero-paragraph",
      "type": "slide-up",
      "trigger": "page-load",
      "duration": 0.8,
      "delay": 0.2,
      "ease": "power3.out",
      "stagger": 0,
      "from": {
        "opacity": 0,
        "y": 32
      }
    },
    {
      "id": "hero-button",
      "type": "slide-up",
      "trigger": "scroll-enter",
      "duration": 0.8,
      "delay": 0.45,
      "ease": "back.out",
      "stagger": 0,
      "from": {
        "opacity": 0,
        "y": 32
      }
    }
  ];
  
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
  
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      motionConfigs.forEach((config) => {
        const target = root.querySelector(`[data-motion-id="${config.id}"]`);
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
  }, []);

  return (
    <div ref={rootRef}>
      <section className="justify-center items-center relative w-full px-5 py-14 min-h-screen m-0 gap-0 rounded-none bg-slate-950 text-white z-[0] overflow-hidden md:justify-center md:items-center md:relative md:w-full md:px-8 md:py-12 md:min-h-screen md:m-0 md:gap-0 md:rounded-none md:bg-slate-950 md:text-white md:z-[0] md:overflow-hidden lg:justify-center lg:items-center lg:relative lg:w-full lg:px-10 lg:py-16 lg:min-h-screen lg:m-0 lg:gap-0 lg:rounded-none lg:bg-slate-950 lg:text-white lg:z-[0] lg:overflow-hidden" data-motion-id="hero-section">
        <div className="flex flex-col justify-center items-center relative w-full max-w-[1120px] p-6 mx-auto gap-8 rounded-2xl bg-white/10 text-white z-[10] overflow-hidden md:flex md:flex-col md:justify-center md:items-center md:relative md:w-full md:max-w-3xl md:p-6 md:mx-auto md:gap-8 md:rounded-2xl md:bg-white/10 md:text-white md:z-[10] md:overflow-hidden lg:flex lg:justify-center lg:items-center lg:relative lg:w-full lg:max-w-[1120px] lg:p-6 lg:mx-auto lg:gap-8 lg:rounded-2xl lg:bg-white/10 lg:text-white lg:z-[10] lg:overflow-hidden" data-motion-id="hero-container">
          <div className="flex flex-col justify-center items-start w-full p-2 m-0 gap-5 rounded-2xl bg-transparent text-white overflow-visible md:flex md:flex-col md:justify-center md:items-center md:w-full md:p-2 md:m-0 md:gap-5 md:rounded-2xl md:bg-transparent md:text-white md:overflow-visible lg:flex lg:flex-col lg:justify-center lg:items-center lg:w-full lg:p-2 lg:m-0 lg:gap-5 lg:rounded-2xl lg:bg-transparent lg:text-white lg:overflow-visible" data-motion-id="text-column">
            <h1 className="block w-full p-0 m-0 text-4xl font-bold bg-transparent text-white overflow-visible leading-tight max-w-3xl md:block md:w-full md:p-0 md:m-0 md:text-4xl md:font-bold md:bg-transparent md:text-center md:text-white md:overflow-visible md:leading-tight md:max-w-3xl lg:block lg:w-full lg:p-0 lg:m-0 lg:text-5xl lg:font-bold lg:bg-transparent lg:text-white lg:overflow-visible lg:leading-tight lg:max-w-3xl" data-motion-id="hero-heading">
              Build animated sections visually
            </h1>
            <p className="block w-full p-0 m-0 text-lg font-normal bg-transparent text-slate-300 text-center overflow-visible max-w-xl leading-7 md:block md:w-full md:p-0 md:m-0 md:text-lg md:font-normal md:bg-transparent md:text-slate-300 md:text-center md:overflow-visible md:max-w-xl md:leading-7 lg:block lg:w-full lg:p-0 lg:m-0 lg:text-lg lg:font-normal lg:bg-transparent lg:text-slate-300 lg:text-center lg:overflow-visible lg:max-w-xl lg:leading-7" data-motion-id="hero-paragraph">
              Design responsive React, Tailwind, and GSAP sections without losing control of the code.
            </p>
            <button className="block w-fit px-5 py-3 m-0 rounded-full text-base font-semibold bg-cyan-300 text-slate-950 overflow-visible md:block md:w-fit md:px-5 md:py-3 md:m-0 md:rounded-full md:text-base md:font-semibold md:bg-cyan-300 md:text-slate-950 md:overflow-visible lg:block lg:w-fit lg:px-5 lg:py-3 lg:m-0 lg:rounded-full lg:text-base lg:font-semibold lg:bg-cyan-300 lg:text-slate-950 lg:overflow-visible" data-motion-id="hero-button">
              Get Started
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
