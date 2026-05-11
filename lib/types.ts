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
};

export type AnimationConfig = {
  type: "none" | "fade-in" | "slide-up" | "slide-left" | "scale-in" | "blur-in";
  trigger: "page-load" | "scroll-enter" | "hover";
  duration: number;
  delay: number;
  ease: string;
  stagger?: number;
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
