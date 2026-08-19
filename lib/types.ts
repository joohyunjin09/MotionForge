export type Viewport = "desktop" | "tablet" | "mobile";

export type InputType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "search"
  | "tel"
  | "url"
  | "date"
  | "time"
  | "color"
  | "checkbox"
  | "radio"
  | "range";

export type ButtonType = "button" | "submit" | "reset";
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type ListType = "unordered" | "ordered";
export type FormMethod = "get" | "post";

export type ElementType =
  | "section"
  | "div"
  | "header"
  | "main"
  | "footer"
  | "nav"
  | "article"
  | "aside"
  | "heading"
  | "paragraph"
  | "span"
  | "link"
  | "button"
  | "image"
  | "list"
  | "listItem"
  | "form"
  | "label"
  | "input"
  | "textarea";

export type StyleConfig = {
  display?: "block" | "flex" | "grid";
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  padding?: string;
  paddingX?: string;
  paddingY?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  margin?: string;
  marginX?: string;
  marginY?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  borderRadius?: string;
  fontSize?: string;
  fontWeight?: string;
  background?: string;
  textColor?: string;
  borderColor?: string;
  opacity?: number;
  zIndex?: number;
  overflow?: "visible" | "hidden";
  customClassName?: string;
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
    href?: string;
    target?: "_self" | "_blank";

    inputType?: InputType;
    placeholder?: string;
    name?: string;
    value?: string;
    checked?: boolean;

    buttonType?: ButtonType;

    headingLevel?: HeadingLevel;

    listType?: ListType;

    htmlFor?: string;
    rows?: number;

    action?: string;
    method?: FormMethod;
  };
  styles: {
    desktop: StyleConfig;
    tablet?: Partial<StyleConfig>;
    mobile?: Partial<StyleConfig>;
  };
  animation?: AnimationConfig;
  children: ElementNode[];
};
