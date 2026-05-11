import type { ReactNode } from "react";
import type { AnimationConfig, ElementNode, StyleConfig, Viewport } from "@/lib/types";
import type { MoveDirection } from "@/lib/treeUtils";
import {
  alignOptions,
  backgroundOptions,
  displayOptions,
  flexDirectionOptions,
  fontSizeOptions,
  fontWeightOptions,
  gapOptions,
  getResolvedStyles,
  justifyOptions,
  marginOptions,
  overflowOptions,
  paddingOptions,
  positionOptions,
  radiusOptions,
  textColorOptions,
  widthOptions,
} from "@/lib/styleUtils";
import { AnimationPanel } from "./AnimationPanel";

const inputClass = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-600">
      {label}
      {children}
    </label>
  );
}

function SelectField<T extends string>({ label, value, options, onChange }: { label: string; value?: T | string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <select className={inputClass} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">inherit/default</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </Field>
  );
}

function ActionButton({
  children,
  disabled,
  tone = "neutral",
  onClick,
}: {
  children: ReactNode;
  disabled: boolean;
  tone?: "neutral" | "danger";
  onClick: () => void;
}) {
  const toneClass =
    tone === "danger"
      ? "border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50"
      : "border-slate-200 text-slate-700 hover:border-cyan-300 hover:text-slate-950";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${toneClass}`}
    >
      {children}
    </button>
  );
}

export function InspectorPanel({
  node,
  viewport,
  canDelete,
  canDuplicate,
  canMoveUp,
  canMoveDown,
  onDuplicate,
  onDelete,
  onMove,
  onStyleChange,
  onPropsChange,
  onAnimationChange,
  onSuggestMobile,
}: {
  node: ElementNode | null;
  viewport: Viewport;
  canDelete: boolean;
  canDuplicate: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (direction: MoveDirection) => void;
  onStyleChange: (patch: Partial<StyleConfig>) => void;
  onPropsChange: (patch: Partial<ElementNode["props"]>) => void;
  onAnimationChange: (patch: Partial<AnimationConfig>) => void;
  onSuggestMobile: () => void;
}) {
  if (!node) {
    return <aside className="w-96 border-l border-slate-200 bg-slate-50 p-4 text-slate-600">Select an element to edit it.</aside>;
  }

  const style = getResolvedStyles(node, viewport);
  const canEditText = node.type === "heading" || node.type === "paragraph" || node.type === "button";

  return (
    <aside className="w-96 overflow-auto border-l border-slate-200 bg-slate-50 p-4 motionforge-scrollbar">
      <div className="mb-4 rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Inspector</p>
        <h2 className="mt-1 text-lg font-bold">{node.name}</h2>
        <p className="text-xs text-slate-400">Editing {viewport} layer with desktop fallback.</p>
      </div>

      <div className="grid gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-slate-950">Selected Element Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton onClick={onDuplicate} disabled={!canDuplicate}>
              Duplicate
            </ActionButton>
            <ActionButton onClick={onDelete} disabled={!canDelete} tone="danger">
              Delete
            </ActionButton>
            <ActionButton onClick={() => onMove("up")} disabled={!canMoveUp}>
              Move Up
            </ActionButton>
            <ActionButton onClick={() => onMove("down")} disabled={!canMoveDown}>
              Move Down
            </ActionButton>
          </div>
          {!canDelete && <p className="mt-3 text-xs text-slate-500">The root section can be edited, but it cannot be deleted, duplicated, or moved.</p>}
        </section>
        {canEditText && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 font-semibold text-slate-950">Content</h3>
            <Field label="Text content">
              <textarea className={`${inputClass} min-h-24 resize-y`} value={node.props.text ?? ""} onChange={(event) => onPropsChange({ text: event.target.value })} />
            </Field>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-950">Layout & Style</h3>
              <p className="text-xs text-slate-500">Controls write into the active viewport layer.</p>
            </div>
            <button type="button" onClick={onSuggestMobile} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
              Suggest Mobile Layout
            </button>
          </div>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Display" value={style.display} options={displayOptions} onChange={(value) => onStyleChange({ display: value as StyleConfig["display"] })} />
              <SelectField label="Flex direction" value={style.flexDirection} options={flexDirectionOptions} onChange={(value) => onStyleChange({ flexDirection: value as StyleConfig["flexDirection"] })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Justify" value={style.justifyContent} options={justifyOptions} onChange={(value) => onStyleChange({ justifyContent: value })} />
              <SelectField label="Align" value={style.alignItems} options={alignOptions} onChange={(value) => onStyleChange({ alignItems: value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Position" value={style.position} options={positionOptions} onChange={(value) => onStyleChange({ position: value as StyleConfig["position"] })} />
              <SelectField label="Width" value={style.width} options={widthOptions} onChange={(value) => onStyleChange({ width: value as StyleConfig["width"] })} />
            </div>
            <SelectField label="Padding preset" value={style.padding} options={paddingOptions} onChange={(value) => onStyleChange({ padding: value })} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Margin" value={style.margin} options={marginOptions} onChange={(value) => onStyleChange({ margin: value })} />
              <SelectField label="Gap" value={style.gap} options={gapOptions} onChange={(value) => onStyleChange({ gap: value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Radius" value={style.borderRadius} options={radiusOptions} onChange={(value) => onStyleChange({ borderRadius: value })} />
              <SelectField label="Font size" value={style.fontSize} options={fontSizeOptions} onChange={(value) => onStyleChange({ fontSize: value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Font weight" value={style.fontWeight} options={fontWeightOptions} onChange={(value) => onStyleChange({ fontWeight: value })} />
              <SelectField label="Overflow" value={style.overflow} options={overflowOptions} onChange={(value) => onStyleChange({ overflow: value as StyleConfig["overflow"] })} />
            </div>
            <SelectField label="Background" value={style.background} options={backgroundOptions} onChange={(value) => onStyleChange({ background: value })} />
            <SelectField label="Text color" value={style.textColor} options={textColorOptions} onChange={(value) => onStyleChange({ textColor: value })} />
            <Field label={`Opacity (${style.opacity ?? 1})`}>
              <input className="accent-cyan-400" type="range" min="0" max="1" step="0.05" value={style.opacity ?? 1} onChange={(event) => onStyleChange({ opacity: Number(event.target.value) })} />
            </Field>
            <Field label="z-index">
              <input className={inputClass} type="number" value={style.zIndex ?? 0} onChange={(event) => onStyleChange({ zIndex: Number(event.target.value) })} />
            </Field>
          </div>
        </section>

        <AnimationPanel animation={node.animation ?? { type: "none", trigger: "page-load", duration: 0.8, delay: 0, ease: "power3.out", stagger: 0 }} onChange={onAnimationChange} hasChildren={node.children.length > 0} />
      </div>
    </aside>
  );
}
