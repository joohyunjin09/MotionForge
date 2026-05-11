import type { ReactNode } from "react";
import type { AnimationConfig, ElementNode, StyleConfig, Viewport } from "@/lib/types";
import type { MoveDirection } from "@/lib/treeUtils";
import { getStyleDiagnostics, type DiagnosticSeverity, type StyleDiagnostic } from "@/lib/styleDiagnostics";
import {
  alignOptions,
  aspectRatioOptions,
  backgroundOptions,
  displayOptions,
  flexDirectionOptions,
  fontSizeOptions,
  fontWeightOptions,
  gapOptions,
  getResolvedStyles,
  justifyOptions,
  letterSpacingOptions,
  lineHeightOptions,
  marginOptions,
  objectFitOptions,
  objectPositionOptions,
  overflowOptions,
  paddingOptions,
  positionOptions,
  radiusOptions,
  textAlignOptions,
  textColorOptions,
  textTransformOptions,
  whiteSpaceOptions,
  widthOptions,
} from "@/lib/styleUtils";
import { AnimationPanel } from "./AnimationPanel";

const inputClass = "h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";
const textareaClass = "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";
const disabledInputClass = "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-50";

const severityBadgeClass: Record<DiagnosticSeverity, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

function pluralize(count: number, label: string) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function diagnosticsSummary(diagnostics: StyleDiagnostic[]) {
  if (diagnostics.length === 0) return "0 issues";

  const counts = diagnostics.reduce<Record<DiagnosticSeverity, number>>(
    (nextCounts, diagnostic) => ({
      ...nextCounts,
      [diagnostic.severity]: nextCounts[diagnostic.severity] + 1,
    }),
    { info: 0, warning: 0, error: 0 },
  );

  return [
    counts.error ? pluralize(counts.error, "error") : "",
    counts.warning ? pluralize(counts.warning, "warning") : "",
    counts.info ? pluralize(counts.info, "info") : "",
  ]
    .filter(Boolean)
    .join(", ");
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 self-start text-xs font-medium text-slate-600">
      <span className="min-w-0 break-words">{label}</span>
      {children}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  disabled,
  hint,
  inactiveHint,
  onChange,
}: {
  label: string;
  value?: T | string;
  options: readonly string[];
  disabled?: boolean;
  hint?: string;
  inactiveHint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select className={`${inputClass} ${disabledInputClass}`} value={value ?? ""} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        <option value="">inherit/default</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      {disabled && hint && <span className="whitespace-normal break-words text-[11px] font-normal leading-snug text-slate-500">{hint}</span>}
      {disabled && value && inactiveHint && <span className="whitespace-normal break-words text-[11px] font-medium leading-snug text-amber-700">{inactiveHint}</span>}
    </Field>
  );
}

const emptyToUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

function TextInputField({
  label,
  value,
  placeholder,
  disabled,
  hint,
  inactiveHint,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  inactiveHint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input className={`${inputClass} ${disabledInputClass}`} value={value ?? ""} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      {disabled && hint && <span className="whitespace-normal break-words text-[11px] font-normal leading-snug text-slate-500">{hint}</span>}
      {disabled && value && inactiveHint && <span className="whitespace-normal break-words text-[11px] font-medium leading-snug text-amber-700">{inactiveHint}</span>}
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
  parent,
  tree,
  viewport,
  canDelete,
  canDuplicate,
  canMoveUp,
  canMoveDown,
  onDuplicate,
  onDelete,
  onMove,
  onNameChange,
  onStyleChange,
  onPropsChange,
  onAnimationChange,
  onSuggestMobile,
}: {
  node: ElementNode | null;
  parent: ElementNode | null;
  tree: ElementNode;
  viewport: Viewport;
  canDelete: boolean;
  canDuplicate: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (direction: MoveDirection) => void;
  onNameChange: (name: string) => void;
  onStyleChange: (patch: Partial<StyleConfig>) => void;
  onPropsChange: (patch: Partial<ElementNode["props"]>) => void;
  onAnimationChange: (patch: Partial<AnimationConfig>) => void;
  onSuggestMobile: () => void;
}) {
  if (!node) {
    return <aside className="w-[22rem] max-w-[22rem] shrink-0 overflow-x-hidden border-l border-slate-200 bg-slate-50 p-4 text-slate-600">Select an element to edit it.</aside>;
  }

  const style = getResolvedStyles(node, viewport);
  const diagnostics = getStyleDiagnostics({ node, parent, viewport, resolvedStyle: style });
  const canEditText = node.type === "heading" || node.type === "paragraph" || node.type === "button";
  const canEditObjectMedia = node.type === "image";
  const currentDisplay = style.display ?? "block";
  const isFlex = currentDisplay === "flex";
  const isGrid = currentDisplay === "grid";
  const supportsFlexOnly = isFlex;
  const supportsGridOnly = isGrid;
  const supportsFlexOrGrid = isFlex || isGrid;
  const currentPosition = style.position ?? "static";
  const supportsOffsets = currentPosition === "relative" || currentPosition === "absolute" || currentPosition === "fixed" || currentPosition === "sticky";
  const flexOnlyHint = "Set Display to flex to use flex direction.";
  const gridOnlyHint = "Set Display to grid to use grid columns.";
  const flexOrGridHint = "Set Display to flex or grid to use alignment controls.";
  const gapHint = "Set Display to flex or grid to use gap.";
  const offsetHint = "Set Position to relative, absolute, fixed, or sticky to use offsets.";

  return (
    <aside className="w-[22rem] max-w-[22rem] shrink-0 overflow-y-auto overflow-x-hidden border-l border-slate-200 bg-slate-50 p-4 motionforge-scrollbar">
      <div className="mb-4 min-w-0 rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Inspector</p>
        <h2 className="mt-1 min-w-0 break-words text-lg font-bold">{node.name}</h2>
        <p className="break-words text-xs text-slate-400">Editing {viewport} layer with desktop fallback.</p>
      </div>

      <div className="grid min-w-0 gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-slate-950">Selected Element Actions</h3>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-2">
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
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 font-semibold text-slate-950">Content</h3>
            <Field label="Text content">
              <textarea
                className={`${textareaClass} min-h-24 resize-y whitespace-normal break-words`}
                value={node.props.text ?? ""}
                onChange={(event) => onPropsChange({ text: event.target.value })}
              />
            </Field>
          </section>
        )}

        <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4" open>
          <summary className="cursor-pointer select-none font-semibold text-slate-950">Advanced Style</summary>
          <p className="mt-1 break-words text-xs text-slate-500">Use Tailwind utilities or raw values such as 1200px, 80vh, 20px, or repeat(3,minmax(0,1fr)).</p>
          <div className="mt-4 grid min-w-0 gap-3">
            <TextInputField label="Element name" value={node.name} onChange={onNameChange} />
            <Field label="Custom Tailwind classes">
              <textarea
                className={`${textareaClass} min-h-20 resize-y whitespace-normal break-words`}
                value={style.customClassName ?? ""}
                placeholder="ring-1 ring-cyan-300/40 backdrop-blur"
                onChange={(event) => onStyleChange({ customClassName: emptyToUndefined(event.target.value) })}
              />
            </Field>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <TextInputField label="Max width" value={style.maxWidth} placeholder="1200px or max-w-6xl" onChange={(value) => onStyleChange({ maxWidth: emptyToUndefined(value) })} />
              <TextInputField label="Min height" value={style.minHeight} placeholder="80vh or min-h-screen" onChange={(value) => onStyleChange({ minHeight: emptyToUndefined(value) })} />
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <TextInputField label="Height" value={style.height} placeholder="400px or h-full" onChange={(value) => onStyleChange({ height: emptyToUndefined(value) })} />
              <TextInputField
                label="Grid columns"
                value={style.gridColumns}
                placeholder="repeat(3,minmax(0,1fr))"
                disabled={!supportsGridOnly}
                hint={gridOnlyHint}
                inactiveHint="Saved value exists, but it is inactive until Display is grid."
                onChange={(value) => onStyleChange({ gridColumns: emptyToUndefined(value) })}
              />
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <TextInputField
                label="Top"
                value={style.insetTop}
                placeholder="20px or top-4"
                disabled={!supportsOffsets}
                hint={offsetHint}
                inactiveHint="Saved value exists, but it is inactive until Position is not static."
                onChange={(value) => onStyleChange({ insetTop: emptyToUndefined(value) })}
              />
              <TextInputField
                label="Right"
                value={style.insetRight}
                placeholder="10% or right-0"
                disabled={!supportsOffsets}
                hint={offsetHint}
                inactiveHint="Saved value exists, but it is inactive until Position is not static."
                onChange={(value) => onStyleChange({ insetRight: emptyToUndefined(value) })}
              />
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <TextInputField
                label="Bottom"
                value={style.insetBottom}
                placeholder="auto or bottom-8"
                disabled={!supportsOffsets}
                hint={offsetHint}
                inactiveHint="Saved value exists, but it is inactive until Position is not static."
                onChange={(value) => onStyleChange({ insetBottom: emptyToUndefined(value) })}
              />
              <TextInputField
                label="Left"
                value={style.insetLeft}
                placeholder="10% or left-0"
                disabled={!supportsOffsets}
                hint={offsetHint}
                inactiveHint="Saved value exists, but it is inactive until Position is not static."
                onChange={(value) => onStyleChange({ insetLeft: emptyToUndefined(value) })}
              />
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <TextInputField label="Border class" value={style.border} placeholder="border border-slate-200" onChange={(value) => onStyleChange({ border: emptyToUndefined(value) })} />
              <TextInputField label="Shadow class" value={style.shadow} placeholder="shadow-xl shadow-slate-950/10" onChange={(value) => onStyleChange({ shadow: emptyToUndefined(value) })} />
            </div>
          </div>
        </details>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-950">Style Diagnostics</h3>
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{diagnosticsSummary(diagnostics)}</span>
          </div>
          {diagnostics.length === 0 ? (
            <p className="break-words text-sm text-slate-500">No obvious style issues detected.</p>
          ) : (
            <div className="grid min-w-0 gap-2">
              {diagnostics.map((diagnostic) => (
                <div key={diagnostic.id} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-1.5 flex min-w-0 items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${severityBadgeClass[diagnostic.severity]}`}>{diagnostic.severity}</span>
                    <p className="min-w-0 break-words text-sm font-semibold text-slate-950">{diagnostic.title}</p>
                  </div>
                  <p className="break-words text-xs leading-5 text-slate-600">{diagnostic.message}</p>
                  {diagnostic.suggestion && <p className="mt-1 break-words text-xs font-medium leading-5 text-slate-700">{diagnostic.suggestion}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-950">Layout & Style</h3>
              <p className="break-words text-xs text-slate-500">Controls write into the active viewport layer.</p>
            </div>
            <button type="button" onClick={onSuggestMobile} className="shrink-0 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
              Suggest Mobile Layout
            </button>
          </div>
          <div className="grid min-w-0 gap-3">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <SelectField label="Display" value={style.display} options={displayOptions} onChange={(value) => onStyleChange({ display: value as StyleConfig["display"] })} />
              <SelectField
                label="Flex direction"
                value={style.flexDirection}
                options={flexDirectionOptions}
                disabled={!supportsFlexOnly}
                hint={flexOnlyHint}
                inactiveHint="Saved value exists, but it is inactive until Display is flex."
                onChange={(value) => onStyleChange({ flexDirection: value as StyleConfig["flexDirection"] })}
              />
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <SelectField label="Justify" value={style.justifyContent} options={justifyOptions} disabled={!supportsFlexOrGrid} hint={flexOrGridHint} onChange={(value) => onStyleChange({ justifyContent: value })} />
              <SelectField label="Align" value={style.alignItems} options={alignOptions} disabled={!supportsFlexOrGrid} hint={flexOrGridHint} onChange={(value) => onStyleChange({ alignItems: value })} />
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <SelectField label="Position" value={style.position} options={positionOptions} onChange={(value) => onStyleChange({ position: value as StyleConfig["position"] })} />
              <SelectField label="Width" value={style.width} options={widthOptions} onChange={(value) => onStyleChange({ width: value as StyleConfig["width"] })} />
            </div>
            <SelectField label="Padding preset" value={style.padding} options={paddingOptions} onChange={(value) => onStyleChange({ padding: value })} />
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <SelectField label="Margin" value={style.margin} options={marginOptions} onChange={(value) => onStyleChange({ margin: value })} />
              <SelectField label="Gap" value={style.gap} options={gapOptions} disabled={!supportsFlexOrGrid} hint={gapHint} onChange={(value) => onStyleChange({ gap: value })} />
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <SelectField label="Radius" value={style.borderRadius} options={radiusOptions} onChange={(value) => onStyleChange({ borderRadius: value })} />
              <SelectField label="Font size" value={style.fontSize} options={fontSizeOptions} onChange={(value) => onStyleChange({ fontSize: value })} />
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <SelectField label="Font weight" value={style.fontWeight} options={fontWeightOptions} onChange={(value) => onStyleChange({ fontWeight: value })} />
              <SelectField label="Overflow" value={style.overflow} options={overflowOptions} onChange={(value) => onStyleChange({ overflow: value as StyleConfig["overflow"] })} />
            </div>
            <SelectField label="Background" value={style.background} options={backgroundOptions} onChange={(value) => onStyleChange({ background: value })} />
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <SelectField label="Text color" value={style.textColor} options={textColorOptions} onChange={(value) => onStyleChange({ textColor: value })} />
              <SelectField label="Text align" value={style.textAlign} options={textAlignOptions} onChange={(value) => onStyleChange({ textAlign: value as StyleConfig["textAlign"] })} />
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <SelectField label="Line height" value={style.lineHeight} options={lineHeightOptions} onChange={(value) => onStyleChange({ lineHeight: value })} />
              <SelectField label="Letter spacing" value={style.letterSpacing} options={letterSpacingOptions} onChange={(value) => onStyleChange({ letterSpacing: value })} />
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <SelectField label="Text transform" value={style.textTransform} options={textTransformOptions} onChange={(value) => onStyleChange({ textTransform: value as StyleConfig["textTransform"] })} />
              <SelectField label="White space" value={style.whiteSpace} options={whiteSpaceOptions} onChange={(value) => onStyleChange({ whiteSpace: value as StyleConfig["whiteSpace"] })} />
            </div>
            <SelectField label="Aspect ratio" value={style.aspectRatio} options={aspectRatioOptions} onChange={(value) => onStyleChange({ aspectRatio: value })} />
            {canEditObjectMedia && (
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <SelectField label="Object fit" value={style.objectFit} options={objectFitOptions} onChange={(value) => onStyleChange({ objectFit: value as StyleConfig["objectFit"] })} />
                <SelectField label="Object position" value={style.objectPosition} options={objectPositionOptions} onChange={(value) => onStyleChange({ objectPosition: value as StyleConfig["objectPosition"] })} />
              </div>
            )}
            <Field label={`Opacity (${style.opacity ?? 1})`}>
              <input className="accent-cyan-400" type="range" min="0" max="1" step="0.05" value={style.opacity ?? 1} onChange={(event) => onStyleChange({ opacity: Number(event.target.value) })} />
            </Field>
            <Field label="z-index">
              <input className={inputClass} type="number" value={style.zIndex ?? 0} onChange={(event) => onStyleChange({ zIndex: Number(event.target.value) })} />
            </Field>
          </div>
        </section>

        <AnimationPanel
          animation={node.animation ?? { type: "none", trigger: "page-load", duration: 0.8, delay: 0, ease: "power3.out", stagger: 0 }}
          onChange={onAnimationChange}
          hasChildren={node.children.length > 0}
          tree={tree}
          node={node}
          parent={parent}
        />
      </div>
    </aside>
  );
}
