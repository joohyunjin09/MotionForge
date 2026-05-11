import type { ReactNode } from "react";
import type { AnimationConfig, ElementNode } from "@/lib/types";
import { flattenTree } from "@/lib/treeUtils";
import {
  animationModeOptions,
  animationTypeOptions,
  easeOptions,
  flipPresetOptions,
  scrollEndOptions,
  scrollStartOptions,
  toggleActionsOptions,
  transformOriginOptions,
  triggerOptions,
} from "@/lib/styleUtils";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 self-start text-xs font-medium text-slate-600">
      <span className="min-w-0 break-words">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-50";
const detailsClass = "rounded-xl border border-slate-200 bg-slate-50 p-3";
const twoColumnClass = "grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3";

type SelectOption = string | { value: string; label: string };

const modeLabel: Record<NonNullable<AnimationConfig["mode"]>, string> = {
  tween: "Tween",
  scroll: "Scroll",
  flip: "Flip",
};

const scrubOptions = ["off", "true", "0.5", "1", "2"];

function numberOrUndefined(value: string) {
  if (value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function scrubValue(scrub: AnimationConfig["scrub"]) {
  if (scrub === undefined || scrub === false) return "off";
  if (scrub === true) return "true";
  return String(scrub);
}

function parseScrub(value: string): AnimationConfig["scrub"] {
  if (value === "off") return undefined;
  if (value === "true") return true;
  return numberOrUndefined(value);
}

function SelectField({
  label,
  value,
  options,
  allowDefault = false,
  onChange,
}: {
  label: string;
  value?: string;
  options: readonly SelectOption[];
  allowDefault?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select className={inputClass} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        {allowDefault && <option value="">default</option>}
        {options.map((option) => (
          <option key={typeof option === "string" ? option : option.value} value={typeof option === "string" ? option : option.value}>
            {typeof option === "string" ? option : option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function TextField({ label, value, placeholder, onChange }: { label: string; value?: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <input className={inputClass} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = "1",
  disabled,
  onChange,
}: {
  label: string;
  value?: number;
  min?: string;
  max?: string;
  step?: string;
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <Field label={label}>
      <input className={inputClass} disabled={disabled} type="number" min={min} max={max} step={step} value={value ?? ""} onChange={(event) => onChange(numberOrUndefined(event.target.value))} />
    </Field>
  );
}

function CheckboxField({ label, checked, onChange }: { label: string; checked?: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex min-w-0 items-center gap-2 self-start text-xs font-medium text-slate-600">
      <input className="h-4 w-4 shrink-0 accent-cyan-400" type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

function emptyToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function elementOptionLabel(node: ElementNode) {
  return `${node.name} (${node.type})`;
}

export function AnimationPanel({
  animation,
  onChange,
  hasChildren,
  tree,
  node,
  parent,
}: {
  animation: AnimationConfig;
  onChange: (patch: Partial<AnimationConfig>) => void;
  hasChildren: boolean;
  tree: ElementNode;
  node: ElementNode;
  parent: ElementNode | null;
}) {
  const mode = animation.mode ?? "tween";
  const showScrollControls = mode === "scroll" || animation.trigger === "scroll-enter";
  const showFlipControls = mode === "flip";
  const triggerTargetOptions: SelectOption[] = [
    { value: "self", label: "Self" },
    { value: "parent", label: parent ? `Parent: ${elementOptionLabel(parent)}` : "Parent" },
    { value: "root", label: `Root: ${elementOptionLabel(tree)}` },
    { value: "canvas", label: "Canvas" },
    ...flattenTree(tree)
      .filter((targetNode) => targetNode.id !== node.id && targetNode.id !== tree.id)
      .map((targetNode) => ({
        value: targetNode.id,
        label: elementOptionLabel(targetNode),
      })),
  ];

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-950">Animation</h3>
        <p className="text-xs text-slate-500">Configure a focused GSAP entrance or interaction.</p>
      </div>

      <div className="grid min-w-0 gap-3">
        <details className={detailsClass} open>
          <summary className="cursor-pointer select-none text-sm font-semibold text-slate-950">Basic Animation</summary>
          <div className="mt-3 grid min-w-0 gap-3">
            <div className={twoColumnClass}>
              <Field label="Mode">
                <select className={inputClass} value={mode} onChange={(event) => onChange({ mode: event.target.value as AnimationConfig["mode"] })}>
                  {animationModeOptions.map((option) => (
                    <option key={option} value={option}>
                      {modeLabel[option]}
                    </option>
                  ))}
                </select>
              </Field>
              <SelectField label="Type preset" value={animation.type} options={animationTypeOptions} onChange={(value) => onChange({ type: value as AnimationConfig["type"] })} />
            </div>
            <SelectField label="Trigger" value={animation.trigger} options={triggerOptions} onChange={(value) => onChange({ trigger: value as AnimationConfig["trigger"] })} />
            <div className={twoColumnClass}>
              <NumberField label="Duration" min="0" step="0.1" value={animation.duration} onChange={(value) => onChange({ duration: value ?? 0 })} />
              <NumberField label="Delay" min="0" step="0.05" value={animation.delay} onChange={(value) => onChange({ delay: value ?? 0 })} />
            </div>
            <SelectField label="Ease" value={animation.ease} options={easeOptions} onChange={(value) => onChange({ ease: value })} />
            <NumberField label={`Stagger${hasChildren ? "" : " (no children)"}`} disabled={!hasChildren} min="0" step="0.01" value={animation.stagger ?? 0} onChange={(value) => onChange({ stagger: value ?? 0 })} />
          </div>
        </details>

        <details className={detailsClass}>
          <summary className="cursor-pointer select-none text-sm font-semibold text-slate-950">Transform</summary>
          <div className="mt-3 grid min-w-0 gap-3">
            <div className={twoColumnClass}>
              <NumberField label="X" step="1" value={animation.x} onChange={(value) => onChange({ x: value })} />
              <NumberField label="Y" step="1" value={animation.y} onChange={(value) => onChange({ y: value })} />
            </div>
            <div className={twoColumnClass}>
              <NumberField label="Rotate" step="1" value={animation.rotate} onChange={(value) => onChange({ rotate: value })} />
              <NumberField label="Scale" step="0.05" value={animation.scale} onChange={(value) => onChange({ scale: value })} />
            </div>
            <div className={twoColumnClass}>
              <NumberField label="Opacity from" min="0" max="1" step="0.05" value={animation.opacity} onChange={(value) => onChange({ opacity: value })} />
              <NumberField label="Blur" min="0" step="1" value={animation.blur} onChange={(value) => onChange({ blur: value })} />
            </div>
            <SelectField label="Transform origin" value={animation.transformOrigin} options={transformOriginOptions} allowDefault onChange={(value) => onChange({ transformOrigin: value || undefined })} />
          </div>
        </details>

        <details className={detailsClass}>
          <summary className="cursor-pointer select-none text-sm font-semibold text-slate-950">Playback</summary>
          <div className="mt-3 grid min-w-0 gap-3">
            <NumberField label="Repeat" step="1" value={animation.repeat} onChange={(value) => onChange({ repeat: value })} />
            <CheckboxField label="Yoyo" checked={animation.yoyo} onChange={(value) => onChange({ yoyo: value })} />
          </div>
        </details>

        {showScrollControls && (
          <details className={detailsClass} open={mode === "scroll"}>
            <summary className="cursor-pointer select-none text-sm font-semibold text-slate-950">ScrollTrigger</summary>
            <div className="mt-3 grid min-w-0 gap-3">
              <div className="rounded-lg border border-cyan-100 bg-white p-2 text-xs leading-snug text-slate-600">
                <p>Preview ScrollTrigger uses the canvas as the scroller.</p>
                <p>Exported code usually uses the page scroll unless a custom scroller is added.</p>
                <p>Markers are shown relative to the canvas preview.</p>
              </div>
              <SelectField label="Trigger target" value={animation.triggerTargetId ?? "self"} options={triggerTargetOptions} onChange={(value) => onChange({ triggerTargetId: value || "self" })} />
              <div className={twoColumnClass}>
                <SelectField label="Start" value={animation.scrollStart} options={scrollStartOptions} allowDefault onChange={(value) => onChange({ scrollStart: value || undefined })} />
                <SelectField label="End" value={animation.scrollEnd} options={scrollEndOptions} allowDefault onChange={(value) => onChange({ scrollEnd: value || undefined })} />
              </div>
              <div className={twoColumnClass}>
                <TextField label="Scroll distance" value={animation.scrollDistance} placeholder="800 or +=800" onChange={(value) => onChange({ scrollDistance: emptyToUndefined(value) })} />
                <TextField label="Canvas scroll height" value={animation.scrollSceneHeight} placeholder="1600px or 200vh" onChange={(value) => onChange({ scrollSceneHeight: emptyToUndefined(value) })} />
              </div>
              <div className={twoColumnClass}>
                <SelectField label="Scrub" value={scrubValue(animation.scrub)} options={scrubOptions} onChange={(value) => onChange({ scrub: parseScrub(value) })} />
                <SelectField label="Toggle actions" value={animation.toggleActions} options={toggleActionsOptions} allowDefault onChange={(value) => onChange({ toggleActions: value || undefined })} />
              </div>
              <div className="grid min-w-0 grid-cols-2 items-start gap-3">
                <CheckboxField label="Pin" checked={animation.pin} onChange={(value) => onChange({ pin: value })} />
                <CheckboxField label="Markers" checked={animation.markers} onChange={(value) => onChange({ markers: value })} />
                <CheckboxField label="Once" checked={animation.once} onChange={(value) => onChange({ once: value })} />
              </div>
              {animation.scrollEnd && animation.scrollDistance && <p className="text-xs leading-snug text-amber-700">Scroll End is active, so Scroll distance is ignored until End is cleared.</p>}
              {animation.pin && <p className="text-xs leading-snug text-amber-700">Pinning is previewed inside the canvas and may differ slightly from full-page export.</p>}
            </div>
          </details>
        )}

        {showFlipControls && (
          <details className={detailsClass} open>
            <summary className="cursor-pointer select-none text-sm font-semibold text-slate-950">Flip</summary>
            <div className="mt-3 grid min-w-0 gap-3">
              <p className="text-xs leading-snug text-slate-500">Flip animates between layout states. It is best for expand, reorder, swap, and card transitions.</p>
              <SelectField label="Flip preset" value={animation.flipPreset ?? "expand"} options={flipPresetOptions} onChange={(value) => onChange({ flipPreset: value as AnimationConfig["flipPreset"] })} />
              <div className="grid min-w-0 grid-cols-2 items-start gap-3">
                <CheckboxField label="Absolute" checked={animation.flipAbsolute} onChange={(value) => onChange({ flipAbsolute: value })} />
                <CheckboxField label="Scale" checked={animation.flipScale} onChange={(value) => onChange({ flipScale: value })} />
                <CheckboxField label="Simple" checked={animation.flipSimple} onChange={(value) => onChange({ flipSimple: value })} />
                <CheckboxField label="Fade" checked={animation.flipFade} onChange={(value) => onChange({ flipFade: value })} />
              </div>
              <Field label="Props">
                <input className={inputClass} value={animation.flipProps ?? ""} placeholder="borderRadius,backgroundColor" onChange={(event) => onChange({ flipProps: event.target.value.trim() || undefined })} />
              </Field>
              {(animation.flipPreset === "swap" || animation.flipPreset === "reorder") && (
                <p className="text-xs leading-snug text-amber-700">Swap/reorder Flip presets require multi-element layout editing and will be expanded later.</p>
              )}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
