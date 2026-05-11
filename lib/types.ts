export type Viewport = "desktop" | "tablet" | "mobile";

export type ElementType = "section" | "div" | "heading" | "paragraph" | "button" | "image";

export type StyleConfig = {
  display?: "block" | "flex" | "grid";
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  width?: "auto" | "full" | "fit" | "1/2" | "1/3" | "2/3";
  padding?: string;
  margin?: string;
  gap?: string;
  borderRadius?: string;
  fontSize?: string;
  fontWeight?: string;
  background?: string;
  textColor?: string;
  opacity?: number;
  zIndex?: number;
  overflow?: "visible" | "hidden";
  customClassName?: string;
  maxWidth?: string;
  minHeight?: string;
  height?: string;
  insetTop?: string;
  insetRight?: string;
  insetBottom?: string;
  insetLeft?: string;
  border?: string;
  shadow?: string;
  gridColumns?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: "normal-case" | "uppercase" | "lowercase" | "capitalize";
  aspectRatio?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  objectPosition?: "center" | "top" | "bottom" | "left" | "right";
  whiteSpace?: "normal" | "nowrap" | "pre-line" | "pre-wrap";
};

export type AnimationConfig = {
  mode?: "tween" | "scroll" | "flip";
  type: "none" | "fade-in" | "slide-up" | "slide-left" | "scale-in" | "blur-in";
  trigger: "page-load" | "scroll-enter" | "hover";
  duration: number;
  delay: number;
  ease: string;
  stagger?: number;
  x?: number;
  y?: number;
  rotate?: number;
  scale?: number;
  opacity?: number;
  blur?: number;
  transformOrigin?: string;
  repeat?: number;
  yoyo?: boolean;
  triggerTargetId?: string | "self" | "parent" | "root" | "canvas";
  interactionTargetId?: string | "self" | "parent" | "root" | "canvas";
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
};

export type ElementNode = {
  id: string;
  type: ElementType;
  name: string;
  props: {
    text?: string;
    src?: string;
    alt?: string;
  };
  styles: {
    desktop: StyleConfig;
    tablet?: Partial<StyleConfig>;
    mobile?: Partial<StyleConfig>;
  };
  animation?: AnimationConfig;
  children: ElementNode[];
};
