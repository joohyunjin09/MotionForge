import { useEffect, useState, type ReactNode } from "react";
import type { AnimationConfig, ButtonType, ElementNode, FormMethod, HeadingLevel, InputType, ListType, StyleConfig, Viewport } from "@/lib/types";
import type { MoveDirection } from "@/lib/treeUtils";
import { getStyleDiagnostics, type DiagnosticSeverity, type StyleDiagnostic } from "@/lib/styleDiagnostics";
import { clampNumber, clampString, normalizeClassName, normalizeCssLength, safeButtonType, safeElementName, safeFormMethod, safeHeadingLevel, safeInputType, safeListType, safeRows, safeUrl, SAFETY_LIMITS, textContentMaxLengthForType } from "@/lib/safety";
import {
  alignOptions,
  aspectRatioOptions,
  backgroundColorSuggestions,
  borderColorSuggestions,
  columnGapSuggestions,
  displayOptions,
  flexDirectionOptions,
  fontSizeOptions,
  fontWeightOptions,
  gapSuggestions,
  getResolvedStyles,
  heightSuggestions,
  justifyOptions,
  letterSpacingOptions,
  lineHeightOptions,
  marginSideSuggestions,
  marginSuggestions,
  marginXSuggestions,
  marginYSuggestions,
  maxHeightSuggestions,
  maxWidthSuggestions,
  minHeightSuggestions,
  minWidthSuggestions,
  objectFitOptions,
  objectPositionOptions,
  overflowOptions,
  paddingSideSuggestions,
  paddingSuggestions,
  paddingXSuggestions,
  paddingYSuggestions,
  positionOptions,
  radiusOptions,
  rowGapSuggestions,
  textAlignOptions,
  textColorSuggestions,
  textTransformOptions,
  whiteSpaceOptions,
  widthSuggestions,
} from "@/lib/styleUtils";
import { AnimationPanel } from "./AnimationPanel";

const inputClass = "h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";
const textareaClass = "w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";
const disabledInputClass = "disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-50";
const textContentTypes = new Set<ElementNode["type"]>(["heading", "paragraph", "button", "span", "link", "listItem", "label"]);
const inputTypeOptions: InputType[] = ["text", "email", "password", "number", "search", "tel", "url", "date", "time", "color", "checkbox", "radio", "range"];
const buttonTypeOptions: ButtonType[] = ["button", "submit", "reset"];
const headingLevelOptions = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
const listTypeOptions: ListType[] = ["unordered", "ordered"];
const methodOptions: FormMethod[] = ["get", "post"];
const targetOptions: Array<NonNullable<ElementNode["props"]["target"]>> = ["_self", "_blank"];

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

function TextInputField({
  label,
  value,
  placeholder,
  disabled,
  hint,
  inactiveHint,
  maxLength,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  inactiveHint?: string;
  maxLength?: number;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        className={`${inputClass} ${disabledInputClass}`}
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(event) => onChange(maxLength ? clampString(event.target.value, maxLength) : event.target.value)}
      />
      {disabled && hint && <span className="whitespace-normal break-words text-[11px] font-normal leading-snug text-slate-500">{hint}</span>}
      {disabled && value && inactiveHint && <span className="whitespace-normal break-words text-[11px] font-medium leading-snug text-amber-700">{inactiveHint}</span>}
    </Field>
  );
}

function ZIndexInput({ value, onChange }: { value?: number; onChange: (value: number | undefined) => void }) {
  const [draft, setDraft] = useState(value === undefined ? "" : String(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setDraft(value === undefined ? "" : String(value));
  }, [isFocused, value]);

  const commit = (nextValue: string) => {
    const trimmed = nextValue.trim();
    if (!trimmed || trimmed === "-") {
      setDraft("");
      onChange(undefined);
      return;
    }

    const clamped = Math.round(clampNumber(trimmed, -9999, 9999, 0));
    setDraft(String(clamped));
    onChange(clamped);
  };

  return (
    <Field label="z-index">
      <input
        className={inputClass}
        value={draft}
        placeholder="0"
        inputMode="numeric"
        maxLength={12}
        onFocus={() => setIsFocused(true)}
        onBlur={(event) => {
          setIsFocused(false);
          commit(event.target.value);
        }}
        onChange={(event) => {
          const nextValue = clampString(event.target.value, 12);
          if (!/^-?\d*$/.test(nextValue)) return;
          setDraft(nextValue);
          if (nextValue === "") {
            onChange(undefined);
          } else if (nextValue !== "-") {
            onChange(Math.round(clampNumber(nextValue, -9999, 9999, 0)));
          }
        }}
      />
    </Field>
  );
}

function SuggestionInput({
  label,
  value,
  placeholder,
  suggestions,
  disabled,
  hint,
  inactiveHint,
  maxLength,
  minQueryLength = 1,
  maxVisibleSuggestions = 5,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  suggestions: readonly string[];
  disabled?: boolean;
  hint?: string;
  inactiveHint?: string;
  maxLength: number;
  minQueryLength?: number;
  maxVisibleSuggestions?: number;
  onChange: (value: string) => void;
}) {
  const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const inputId = `motionforge-${normalizedLabel}-input`;
  const listboxId = `motionforge-${normalizedLabel}-suggestions`;
  const query = (value ?? "").trim().toLowerCase();
  const [isFocused, setIsFocused] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const visibleSuggestions = suggestions
    .filter((suggestion) => query.length >= minQueryLength && suggestion.toLowerCase().includes(query))
    .slice(0, maxVisibleSuggestions);
  const showSuggestions = !disabled && isFocused && isSuggestionOpen && visibleSuggestions.length > 0;

  const handleChange = (nextValue: string) => {
    setIsSuggestionOpen(true);
    onChange(clampString(nextValue, maxLength));
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    setIsSuggestionOpen(false);
  };

  return (
    <div className="flex min-w-0 flex-col gap-1 self-start text-xs font-medium text-slate-600">
      <label htmlFor={inputId} className="min-w-0 break-words">
        {label}
      </label>
      <input
        id={inputId}
        role="combobox"
        className={`${inputClass} ${disabledInputClass}`}
        aria-controls={showSuggestions ? listboxId : undefined}
        aria-autocomplete="list"
        aria-expanded={showSuggestions}
        aria-haspopup="listbox"
        value={value ?? ""}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        onFocus={() => {
          setIsFocused(true);
          setIsSuggestionOpen(false);
        }}
        onBlur={() => {
          setIsFocused(false);
          setIsSuggestionOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setIsSuggestionOpen(false);
        }}
        onChange={(event) => handleChange(event.target.value)}
      />
      {showSuggestions && (
        <div id={listboxId} role="listbox" className="flex min-w-0 flex-wrap gap-1 pt-1">
          {visibleSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              role="option"
              aria-selected={false}
              className="max-w-full truncate rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-slate-950"
              title={suggestion}
              onMouseDown={(event) => {
                event.preventDefault();
                handleSuggestionSelect(suggestion);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      {hint && <span className="whitespace-normal break-words text-[11px] font-normal leading-snug text-slate-500">{hint}</span>}
      {disabled && value && inactiveHint && <span className="whitespace-normal break-words text-[11px] font-medium leading-snug text-amber-700">{inactiveHint}</span>}
    </div>
  );
}

function ColorInput({
  label,
  value,
  placeholder,
  suggestions,
  maxLength,
  onChange,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  suggestions: readonly string[];
  maxLength: number;
  onChange: (value: string) => void;
}) {
  return (
    <SuggestionInput
      label={label}
      value={value}
      placeholder={placeholder}
      suggestions={suggestions}
      hint="Type Tailwind utility or CSS value."
      minQueryLength={2}
      maxVisibleSuggestions={5}
      maxLength={maxLength}
      onChange={onChange}
    />
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-slate-600">
      <input className="h-4 w-4 shrink-0 accent-cyan-400" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

const optionalText = (value: string, maxLength: number) => {
  const trimmed = clampString(value, maxLength).trim();
  return trimmed || undefined;
};

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
  const canEditText = textContentTypes.has(node.type);
  const canEditObjectMedia = node.type === "image";
  const canEditLinkProps = node.type === "link";
  const canEditImageProps = node.type === "image";
  const canEditHeadingProps = node.type === "heading";
  const canEditButtonProps = node.type === "button";
  const canEditInputProps = node.type === "input";
  const canEditTextareaProps = node.type === "textarea";
  const canEditLabelProps = node.type === "label";
  const canEditListProps = node.type === "list";
  const canEditFormProps = node.type === "form";
  const hasContentControls = canEditText || canEditLinkProps || canEditImageProps || canEditHeadingProps || canEditButtonProps || canEditInputProps || canEditTextareaProps || canEditListProps || canEditFormProps;
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
  const textContentLimit = textContentMaxLengthForType(node.type);
  const selectedInputType = canEditInputProps ? safeInputType(node.props.inputType) : "text";
  const inputUsesChecked = selectedInputType === "checkbox" || selectedInputType === "radio";

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
        {hasContentControls && (
          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 font-semibold text-slate-950">Content</h3>
            <div className="grid min-w-0 gap-3">
              {canEditText && (
                <Field label="Text content">
                  <textarea
                    className={`${textareaClass} min-h-24 resize-y whitespace-normal break-words`}
                    value={node.props.text ?? ""}
                    maxLength={textContentLimit}
                    onChange={(event) => onPropsChange({ text: clampString(event.target.value, textContentLimit) })}
                  />
                </Field>
              )}
              {canEditHeadingProps && (
                <SelectField
                  label="Heading level"
                  value={`h${safeHeadingLevel(node.props.headingLevel)}`}
                  options={headingLevelOptions}
                  onChange={(value) => {
                    const level = Number(value.replace("h", ""));
                    onPropsChange({ headingLevel: level >= 1 && level <= 6 ? (level as HeadingLevel) : undefined });
                  }}
                />
              )}
              {canEditButtonProps && (
                <SelectField
                  label="Button type"
                  value={safeButtonType(node.props.buttonType)}
                  options={buttonTypeOptions}
                  onChange={(value) => onPropsChange({ buttonType: value ? (value as ButtonType) : undefined })}
                />
              )}
              {canEditLinkProps && (
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                  <TextInputField
                    label="Href"
                    value={node.props.href}
                    placeholder="#"
                    maxLength={SAFETY_LIMITS.url}
                    onChange={(value) => onPropsChange({ href: value.trim() ? safeUrl(value, "#") : undefined })}
                  />
                  <SelectField
                    label="Target"
                    value={node.props.target ?? "_self"}
                    options={targetOptions}
                    onChange={(value) => onPropsChange({ target: value ? (value as ElementNode["props"]["target"]) : undefined })}
                  />
                </div>
              )}
              {canEditImageProps && (
                <div className="grid min-w-0 gap-3">
                  <TextInputField
                    label="Image source"
                    value={node.props.src}
                    placeholder="https://..."
                    maxLength={SAFETY_LIMITS.url}
                    onChange={(value) => onPropsChange({ src: value.trim() ? safeUrl(value, "") || undefined : undefined })}
                  />
                  <TextInputField
                    label="Alt text"
                    value={node.props.alt}
                    placeholder="Describe the image"
                    maxLength={SAFETY_LIMITS.altText}
                    onChange={(value) => onPropsChange({ alt: optionalText(value, SAFETY_LIMITS.altText) })}
                  />
                </div>
              )}
              {canEditInputProps && (
                <div className="grid min-w-0 gap-3">
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                    <SelectField
                      label="Input type"
                      value={selectedInputType}
                      options={inputTypeOptions}
                      onChange={(value) => onPropsChange({ inputType: value ? (value as InputType) : undefined })}
                    />
                    <TextInputField label="Name" value={node.props.name} placeholder="email" maxLength={SAFETY_LIMITS.elementName} onChange={(value) => onPropsChange({ name: optionalText(value, SAFETY_LIMITS.elementName) })} />
                  </div>
                  <TextInputField
                    label="Placeholder"
                    value={node.props.placeholder}
                    placeholder="Enter text..."
                    maxLength={SAFETY_LIMITS.placeholder}
                    onChange={(value) => onPropsChange({ placeholder: optionalText(value, SAFETY_LIMITS.placeholder) })}
                  />
                  <TextInputField
                    label="Value"
                    value={node.props.value}
                    placeholder={inputUsesChecked ? "field value" : "Default value"}
                    maxLength={SAFETY_LIMITS.shortText}
                    onChange={(value) => onPropsChange({ value: optionalText(value, SAFETY_LIMITS.shortText) })}
                  />
                  {inputUsesChecked && <ToggleField label="Checked by default" checked={Boolean(node.props.checked)} onChange={(checked) => onPropsChange({ checked })} />}
                </div>
              )}
              {canEditTextareaProps && (
                <div className="grid min-w-0 gap-3">
                  <TextInputField
                    label="Placeholder"
                    value={node.props.placeholder}
                    placeholder="Write something..."
                    maxLength={SAFETY_LIMITS.placeholder}
                    onChange={(value) => onPropsChange({ placeholder: optionalText(value, SAFETY_LIMITS.placeholder) })}
                  />
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                    <TextInputField label="Name" value={node.props.name} placeholder="message" maxLength={SAFETY_LIMITS.elementName} onChange={(value) => onPropsChange({ name: optionalText(value, SAFETY_LIMITS.elementName) })} />
                    <Field label="Rows">
                      <input
                        className={inputClass}
                        type="number"
                        min="1"
                        max="20"
                        step="1"
                        value={node.props.rows ?? ""}
                        onChange={(event) => {
                          onPropsChange({ rows: event.target.value === "" ? undefined : safeRows(event.target.value) });
                        }}
                      />
                    </Field>
                  </div>
                </div>
              )}
              {canEditLabelProps && <TextInputField label="For" value={node.props.htmlFor} placeholder="field-id" maxLength={SAFETY_LIMITS.elementName} onChange={(value) => onPropsChange({ htmlFor: optionalText(value, SAFETY_LIMITS.elementName) })} />}
              {canEditListProps && (
                <SelectField
                  label="List type"
                  value={safeListType(node.props.listType)}
                  options={listTypeOptions}
                  onChange={(value) => onPropsChange({ listType: value ? (value as ListType) : undefined })}
                />
              )}
              {canEditFormProps && (
                <div className="grid min-w-0 gap-3">
                  <TextInputField
                    label="Action"
                    value={node.props.action}
                    placeholder="/contact"
                    maxLength={SAFETY_LIMITS.url}
                    onChange={(value) => onPropsChange({ action: value.trim() ? safeUrl(value, "") || undefined : undefined })}
                  />
                  <SelectField
                    label="Method"
                    value={safeFormMethod(node.props.method)}
                    options={methodOptions}
                    onChange={(value) => onPropsChange({ method: value ? (value as FormMethod) : undefined })}
                  />
                </div>
              )}
            </div>
          </section>
        )}

        <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4" open>
          <summary className="cursor-pointer select-none font-semibold text-slate-950">Advanced Style</summary>
          <p className="mt-1 break-words text-xs text-slate-500">Use Tailwind utilities or raw CSS values. Suggestions are shortcuts; typed values are not limited to the lists.</p>
          <div className="mt-4 grid min-w-0 gap-5">
            <div className="grid min-w-0 gap-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Identity</h4>
              <TextInputField label="Element name" value={node.name} maxLength={SAFETY_LIMITS.elementName} onChange={(value) => onNameChange(safeElementName(value))} />
              <Field label="Custom Tailwind classes">
                <textarea
                  className={`${textareaClass} min-h-20 resize-y whitespace-normal break-words`}
                  value={style.customClassName ?? ""}
                  placeholder="ring-1 ring-cyan-300/40 backdrop-blur"
                  maxLength={SAFETY_LIMITS.customClassName}
                  onChange={(event) => onStyleChange({ customClassName: normalizeClassName(event.target.value) })}
                />
              </Field>
            </div>

            <div className="grid min-w-0 gap-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Size</h4>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <SuggestionInput label="Width" value={style.width} placeholder="w-full or 600px" suggestions={widthSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ width: normalizeCssLength(value) })} />
                <SuggestionInput label="Min width" value={style.minWidth} placeholder="min-w-0 or 320px" suggestions={minWidthSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ minWidth: normalizeCssLength(value) })} />
              </div>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <SuggestionInput label="Max width" value={style.maxWidth} placeholder="max-w-6xl or 1120px" suggestions={maxWidthSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ maxWidth: normalizeCssLength(value) })} />
                <SuggestionInput label="Height" value={style.height} placeholder="h-full or 400px" suggestions={heightSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ height: normalizeCssLength(value) })} />
              </div>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <SuggestionInput label="Min height" value={style.minHeight} placeholder="min-h-screen or 80vh" suggestions={minHeightSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ minHeight: normalizeCssLength(value) })} />
                <SuggestionInput label="Max height" value={style.maxHeight} placeholder="max-h-screen or 80vh" suggestions={maxHeightSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ maxHeight: normalizeCssLength(value) })} />
              </div>
            </div>

            <div className="grid min-w-0 gap-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Spacing</h4>
              <SuggestionInput label="Padding" value={style.padding} placeholder="p-6 or 24px" suggestions={paddingSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ padding: normalizeCssLength(value) })} />
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <SuggestionInput label="Padding X" value={style.paddingX} placeholder="px-6 or 24px" suggestions={paddingXSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ paddingX: normalizeCssLength(value) })} />
                <SuggestionInput label="Padding Y" value={style.paddingY} placeholder="py-10 or 32px" suggestions={paddingYSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ paddingY: normalizeCssLength(value) })} />
              </div>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <SuggestionInput label="Padding top" value={style.paddingTop} placeholder="pt-4 or 16px" suggestions={paddingSideSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ paddingTop: normalizeCssLength(value) })} />
                <SuggestionInput label="Padding right" value={style.paddingRight} placeholder="pr-4 or 16px" suggestions={paddingSideSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ paddingRight: normalizeCssLength(value) })} />
              </div>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <SuggestionInput label="Padding bottom" value={style.paddingBottom} placeholder="pb-4 or 16px" suggestions={paddingSideSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ paddingBottom: normalizeCssLength(value) })} />
                <SuggestionInput label="Padding left" value={style.paddingLeft} placeholder="pl-4 or 16px" suggestions={paddingSideSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ paddingLeft: normalizeCssLength(value) })} />
              </div>
              <SuggestionInput label="Margin" value={style.margin} placeholder="mx-auto or 24px" suggestions={marginSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ margin: normalizeCssLength(value) })} />
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <SuggestionInput label="Margin X" value={style.marginX} placeholder="mx-auto or auto" suggestions={marginXSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ marginX: normalizeCssLength(value) })} />
                <SuggestionInput label="Margin Y" value={style.marginY} placeholder="my-8 or 24px" suggestions={marginYSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ marginY: normalizeCssLength(value) })} />
              </div>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <SuggestionInput label="Margin top" value={style.marginTop} placeholder="mt-8 or 24px" suggestions={marginSideSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ marginTop: normalizeCssLength(value) })} />
                <SuggestionInput label="Margin right" value={style.marginRight} placeholder="mr-4 or auto" suggestions={marginSideSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ marginRight: normalizeCssLength(value) })} />
              </div>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <SuggestionInput label="Margin bottom" value={style.marginBottom} placeholder="mb-4 or 24px" suggestions={marginSideSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ marginBottom: normalizeCssLength(value) })} />
                <SuggestionInput label="Margin left" value={style.marginLeft} placeholder="ml-4 or auto" suggestions={marginSideSuggestions} maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ marginLeft: normalizeCssLength(value) })} />
              </div>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <SuggestionInput
                  label="Gap"
                  value={style.gap}
                  placeholder="gap-8 or 24px"
                  suggestions={gapSuggestions}
                  disabled={!supportsFlexOrGrid}
                  hint={!supportsFlexOrGrid ? gapHint : undefined}
                  inactiveHint="Saved value exists, but it is inactive until Display is flex or grid."
                  maxLength={SAFETY_LIMITS.rawCss}
                  onChange={(value) => onStyleChange({ gap: normalizeCssLength(value) })}
                />
                <SuggestionInput
                  label="Row gap"
                  value={style.rowGap}
                  placeholder="gap-y-8 or 24px"
                  suggestions={rowGapSuggestions}
                  disabled={!supportsFlexOrGrid}
                  hint={!supportsFlexOrGrid ? gapHint : undefined}
                  inactiveHint="Saved value exists, but it is inactive until Display is flex or grid."
                  maxLength={SAFETY_LIMITS.rawCss}
                  onChange={(value) => onStyleChange({ rowGap: normalizeCssLength(value) })}
                />
              </div>
              <SuggestionInput
                label="Column gap"
                value={style.columnGap}
                placeholder="gap-x-8 or 24px"
                suggestions={columnGapSuggestions}
                disabled={!supportsFlexOrGrid}
                hint={!supportsFlexOrGrid ? gapHint : undefined}
                inactiveHint="Saved value exists, but it is inactive until Display is flex or grid."
                maxLength={SAFETY_LIMITS.rawCss}
                onChange={(value) => onStyleChange({ columnGap: normalizeCssLength(value) })}
              />
            </div>

            <div className="grid min-w-0 gap-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Position offsets</h4>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <TextInputField
                  label="Top"
                  value={style.insetTop}
                  placeholder="20px or top-4"
                  disabled={!supportsOffsets}
                  hint={offsetHint}
                  inactiveHint="Saved value exists, but it is inactive until Position is not static."
                  maxLength={SAFETY_LIMITS.rawCss}
                  onChange={(value) => onStyleChange({ insetTop: normalizeCssLength(value) })}
                />
                <TextInputField
                  label="Right"
                  value={style.insetRight}
                  placeholder="10% or right-0"
                  disabled={!supportsOffsets}
                  hint={offsetHint}
                  inactiveHint="Saved value exists, but it is inactive until Position is not static."
                  maxLength={SAFETY_LIMITS.rawCss}
                  onChange={(value) => onStyleChange({ insetRight: normalizeCssLength(value) })}
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
                  maxLength={SAFETY_LIMITS.rawCss}
                  onChange={(value) => onStyleChange({ insetBottom: normalizeCssLength(value) })}
                />
                <TextInputField
                  label="Left"
                  value={style.insetLeft}
                  placeholder="10% or left-0"
                  disabled={!supportsOffsets}
                  hint={offsetHint}
                  inactiveHint="Saved value exists, but it is inactive until Position is not static."
                  maxLength={SAFETY_LIMITS.rawCss}
                  onChange={(value) => onStyleChange({ insetLeft: normalizeCssLength(value) })}
                />
              </div>
            </div>

            <div className="grid min-w-0 gap-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Border / Shadow / Grid</h4>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <TextInputField label="Border class" value={style.border} placeholder="border border-slate-200" maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ border: normalizeCssLength(value) })} />
                <ColorInput
                  label="Border color"
                  value={style.borderColor}
                  placeholder="border-slate-200 or #ffffff"
                  suggestions={borderColorSuggestions}
                  maxLength={SAFETY_LIMITS.rawCss}
                  onChange={(value) => onStyleChange({ borderColor: normalizeCssLength(value) })}
                />
              </div>
              <TextInputField label="Shadow class" value={style.shadow} placeholder="shadow-xl shadow-slate-950/10" maxLength={SAFETY_LIMITS.rawCss} onChange={(value) => onStyleChange({ shadow: normalizeCssLength(value) })} />
              <ZIndexInput value={style.zIndex} onChange={(value) => onStyleChange({ zIndex: value })} />
              <TextInputField
                label="Grid columns"
                value={style.gridColumns}
                placeholder="repeat(3,minmax(0,1fr))"
                disabled={!supportsGridOnly}
                hint={gridOnlyHint}
                inactiveHint="Saved value exists, but it is inactive until Display is grid."
                maxLength={SAFETY_LIMITS.gridColumns}
                onChange={(value) => onStyleChange({ gridColumns: normalizeCssLength(value, SAFETY_LIMITS.gridColumns) })}
              />
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
              <SelectField label="Radius" value={style.borderRadius} options={radiusOptions} onChange={(value) => onStyleChange({ borderRadius: value })} />
            </div>
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <SelectField label="Font size" value={style.fontSize} options={fontSizeOptions} onChange={(value) => onStyleChange({ fontSize: value })} />
              <SelectField label="Font weight" value={style.fontWeight} options={fontWeightOptions} onChange={(value) => onStyleChange({ fontWeight: value })} />
            </div>
            <SelectField label="Overflow" value={style.overflow} options={overflowOptions} onChange={(value) => onStyleChange({ overflow: value as StyleConfig["overflow"] })} />
            <ColorInput
              label="Background"
              value={style.background}
              placeholder="bg-white, #ffffff, rgb(...), var(--color)"
              suggestions={backgroundColorSuggestions}
              maxLength={SAFETY_LIMITS.rawCss}
              onChange={(value) => onStyleChange({ background: normalizeCssLength(value) })}
            />
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
              <ColorInput
                label="Text color"
                value={style.textColor}
                placeholder="text-slate-950, #0f172a, currentColor"
                suggestions={textColorSuggestions}
                maxLength={SAFETY_LIMITS.rawCss}
                onChange={(value) => onStyleChange({ textColor: normalizeCssLength(value) })}
              />
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
              <input className="accent-cyan-400" type="range" min="0" max="1" step="0.05" value={clampNumber(style.opacity, 0, 1, 1)} onChange={(event) => onStyleChange({ opacity: clampNumber(event.target.value, 0, 1, 1) })} />
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
