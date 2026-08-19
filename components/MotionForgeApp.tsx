"use client";

import { useEffect, useMemo, useState } from "react";
import { CanvasPreview } from "./CanvasPreview";
import { CodeExportModal } from "./CodeExportModal";
import { ElementTree } from "./ElementTree";
import { ErrorBoundary } from "./ErrorBoundary";
import { InspectorPanel } from "./InspectorPanel";
import { TopToolbar } from "./TopToolbar";
import { defaultTree } from "@/lib/defaultTree";
import type { AnimationConfig, ElementNode, StyleConfig, Viewport } from "@/lib/types";
import {
  addNodeToTree,
  cloneTree,
  createDefaultNode,
  deleteNodeById,
  duplicateNodeById,
  findNodeById,
  findParentNode,
  mapTree,
  moveNode,
  moveNodeToParentIndex,
  updateNodeById,
  type AddableElementType,
  type MoveDirection,
  type TreeMutationResult,
} from "@/lib/treeUtils";
import { getResolvedStyles, suggestMobileStyle } from "@/lib/styleUtils";
import {
  clampNumber,
  clampString,
  normalizeClassName,
  normalizeCssLength,
  safeAnimationConfig,
  safeButtonType,
  safeElementName,
  safeFormMethod,
  safeHeadingLevel,
  safeInputType,
  safeListType,
  safeRows,
  safeTarget,
  safeUrl,
  SAFETY_LIMITS,
  textContentMaxLengthForType,
} from "@/lib/safety";

function sanitizeStylePatch(patch: Partial<StyleConfig>): Partial<StyleConfig> {
  const next: Partial<StyleConfig> = { ...patch };
  if ("width" in next) next.width = normalizeCssLength(next.width);
  if ("minWidth" in next) next.minWidth = normalizeCssLength(next.minWidth);
  if ("maxWidth" in next) next.maxWidth = normalizeCssLength(next.maxWidth);
  if ("maxHeight" in next) next.maxHeight = normalizeCssLength(next.maxHeight);
  if ("minHeight" in next) next.minHeight = normalizeCssLength(next.minHeight);
  if ("height" in next) next.height = normalizeCssLength(next.height);
  if ("padding" in next) next.padding = normalizeCssLength(next.padding);
  if ("paddingX" in next) next.paddingX = normalizeCssLength(next.paddingX);
  if ("paddingY" in next) next.paddingY = normalizeCssLength(next.paddingY);
  if ("paddingTop" in next) next.paddingTop = normalizeCssLength(next.paddingTop);
  if ("paddingRight" in next) next.paddingRight = normalizeCssLength(next.paddingRight);
  if ("paddingBottom" in next) next.paddingBottom = normalizeCssLength(next.paddingBottom);
  if ("paddingLeft" in next) next.paddingLeft = normalizeCssLength(next.paddingLeft);
  if ("margin" in next) next.margin = normalizeCssLength(next.margin);
  if ("marginX" in next) next.marginX = normalizeCssLength(next.marginX);
  if ("marginY" in next) next.marginY = normalizeCssLength(next.marginY);
  if ("marginTop" in next) next.marginTop = normalizeCssLength(next.marginTop);
  if ("marginRight" in next) next.marginRight = normalizeCssLength(next.marginRight);
  if ("marginBottom" in next) next.marginBottom = normalizeCssLength(next.marginBottom);
  if ("marginLeft" in next) next.marginLeft = normalizeCssLength(next.marginLeft);
  if ("gap" in next) next.gap = normalizeCssLength(next.gap);
  if ("rowGap" in next) next.rowGap = normalizeCssLength(next.rowGap);
  if ("columnGap" in next) next.columnGap = normalizeCssLength(next.columnGap);
  if ("insetTop" in next) next.insetTop = normalizeCssLength(next.insetTop);
  if ("insetRight" in next) next.insetRight = normalizeCssLength(next.insetRight);
  if ("insetBottom" in next) next.insetBottom = normalizeCssLength(next.insetBottom);
  if ("insetLeft" in next) next.insetLeft = normalizeCssLength(next.insetLeft);
  if ("background" in next) next.background = normalizeCssLength(next.background);
  if ("textColor" in next) next.textColor = normalizeCssLength(next.textColor);
  if ("border" in next) next.border = normalizeCssLength(next.border);
  if ("borderColor" in next) next.borderColor = normalizeCssLength(next.borderColor);
  if ("shadow" in next) next.shadow = normalizeCssLength(next.shadow);
  if ("gridColumns" in next) next.gridColumns = normalizeCssLength(next.gridColumns, SAFETY_LIMITS.gridColumns);
  if ("aspectRatio" in next) next.aspectRatio = normalizeCssLength(next.aspectRatio);
  if ("lineHeight" in next) next.lineHeight = normalizeCssLength(next.lineHeight);
  if ("letterSpacing" in next) next.letterSpacing = normalizeCssLength(next.letterSpacing);
  if ("customClassName" in next) next.customClassName = normalizeClassName(next.customClassName);
  if ("opacity" in next) next.opacity = clampNumber(next.opacity, 0, 1, 1);
  if ("zIndex" in next) next.zIndex = next.zIndex === undefined ? undefined : Math.round(clampNumber(next.zIndex, -9999, 9999, 0));
  return next;
}

function sanitizePropsPatch(node: ElementNode, patch: Partial<ElementNode["props"]>): Partial<ElementNode["props"]> {
  const textLimit = textContentMaxLengthForType(node.type);
  const next: Partial<ElementNode["props"]> = { ...patch };
  if ("text" in next) next.text = clampString(next.text, textLimit);
  if ("src" in next) next.src = next.src ? safeUrl(next.src, "") || undefined : undefined;
  if ("alt" in next) next.alt = next.alt ? clampString(next.alt, SAFETY_LIMITS.altText) : undefined;
  if ("href" in next) next.href = next.href ? safeUrl(next.href, "#") : undefined;
  if ("target" in next) next.target = safeTarget(next.target);
  if ("placeholder" in next) next.placeholder = next.placeholder ? clampString(next.placeholder, SAFETY_LIMITS.placeholder) : undefined;
  if ("inputType" in next) next.inputType = safeInputType(next.inputType);
  if ("name" in next) next.name = next.name ? clampString(next.name, SAFETY_LIMITS.elementName).trim() : undefined;
  if ("value" in next) next.value = next.value ? clampString(next.value, SAFETY_LIMITS.shortText) : undefined;
  if ("checked" in next) next.checked = Boolean(next.checked);
  if ("buttonType" in next) next.buttonType = safeButtonType(next.buttonType);
  if ("headingLevel" in next) next.headingLevel = safeHeadingLevel(next.headingLevel);
  if ("listType" in next) next.listType = safeListType(next.listType);
  if ("htmlFor" in next) next.htmlFor = next.htmlFor ? clampString(next.htmlFor, SAFETY_LIMITS.elementName).trim() : undefined;
  if ("rows" in next) next.rows = next.rows === undefined ? undefined : safeRows(next.rows);
  if ("action" in next) next.action = next.action ? safeUrl(next.action, "") || undefined : undefined;
  if ("method" in next) next.method = safeFormMethod(next.method);
  return next;
}

function ResetConfirmationDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="reset-project-title" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl">
        <h2 id="reset-project-title" className="text-lg font-bold">
          Reset project?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">This will reset the current canvas to the default MotionForge starter layout. Your current edits will be lost.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export function MotionForgeApp() {
  const [tree, setTree] = useState<ElementNode>(() => cloneTree(defaultTree));
  const [selectedId, setSelectedId] = useState(defaultTree.id);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const selectedNode = useMemo(() => findNodeById(tree, selectedId) ?? tree, [tree, selectedId]);
  const selectedParent = useMemo(() => (selectedNode.id === tree.id ? null : findParentNode(tree, selectedNode.id)), [selectedNode, tree]);
  const selectedSiblingIndex = selectedParent?.children.findIndex((child) => child.id === selectedNode.id) ?? -1;
  const canDeleteSelected = selectedNode.id !== tree.id;
  const canDuplicateSelected = selectedNode.id !== tree.id;
  const canMoveSelectedUp = selectedSiblingIndex > 0;
  const canMoveSelectedDown = Boolean(selectedParent && selectedSiblingIndex >= 0 && selectedSiblingIndex < selectedParent.children.length - 1);

  const updateSelectedNode = (updater: (node: ElementNode) => ElementNode) => {
    setTree((current) => updateNodeById(current, selectedNode.id, updater));
  };

  const handleStyleChange = (patch: Partial<StyleConfig>) => {
    const safePatch = sanitizeStylePatch(patch);
    updateSelectedNode((node) => ({
      ...node,
      styles: {
        ...node.styles,
        [viewport]: {
          ...(viewport === "desktop" ? node.styles.desktop : node.styles[viewport]),
          ...safePatch,
        },
      },
    }));
  };

  const handlePropsChange = (patch: Partial<ElementNode["props"]>) => {
    updateSelectedNode((node) => ({ ...node, props: { ...node.props, ...sanitizePropsPatch(node, patch) } }));
  };

  const handleNameChange = (name: string) => {
    updateSelectedNode((node) => ({ ...node, name: safeElementName(name) }));
  };

  const handleAnimationChange = (patch: Partial<AnimationConfig>) => {
    updateSelectedNode((node) => ({
      ...node,
      animation: safeAnimationConfig({
        type: "none",
        trigger: "page-load",
        duration: 0.8,
        delay: 0,
        ease: "power3.out",
        stagger: 0,
        ...node.animation,
        ...patch,
      }),
    }));
  };

  const applyTreeMutation = (mutation: TreeMutationResult) => {
    setTree(mutation.tree);
    setSelectedId(mutation.selectedId);
  };

  const handleAddElement = (type: AddableElementType, targetId = selectedNode.id) => {
    const newNode = createDefaultNode(type);
    const safeTargetId = findNodeById(tree, targetId) ? targetId : tree.id;
    applyTreeMutation(addNodeToTree(tree, safeTargetId, newNode));
  };

  const handleDuplicateElement = (id: string) => {
    if (id === tree.id) return;
    applyTreeMutation(duplicateNodeById(tree, id));
  };

  const handleDeleteElement = (id: string) => {
    if (id === tree.id) return;
    applyTreeMutation(deleteNodeById(tree, id));
  };

  const handleMoveElement = (id: string, direction: MoveDirection) => {
    if (id === tree.id) return;
    applyTreeMutation(moveNode(tree, id, direction));
  };

  const handleMoveElementToDropPosition = (id: string, targetParentId: string, targetIndex: number) => {
    if (id === tree.id) return;
    applyTreeMutation(moveNodeToParentIndex(tree, id, targetParentId, targetIndex));
  };

  const handleDuplicateSelected = () => {
    if (!canDuplicateSelected) return;
    handleDuplicateElement(selectedNode.id);
  };

  const handleDeleteSelected = () => {
    if (!canDeleteSelected) return;
    handleDeleteElement(selectedNode.id);
  };

  const handleMoveSelected = (direction: MoveDirection) => {
    if (direction === "up" && !canMoveSelectedUp) return;
    if (direction === "down" && !canMoveSelectedDown) return;
    handleMoveElement(selectedNode.id, direction);
  };

  const handleSuggestMobile = () => {
    setTree((current) =>
      mapTree(current, (node) => ({
        ...node,
        styles: {
          ...node.styles,
          mobile: {
            ...(node.styles.mobile ?? {}),
            ...suggestMobileStyle(getResolvedStyles(node, "desktop")),
          },
        },
      })),
    );
    setViewport("mobile");
  };

  const handleReset = () => {
    setTree(cloneTree(defaultTree));
    setSelectedId(defaultTree.id);
    setViewport("desktop");
  };

  const handleConfirmReset = () => {
    handleReset();
    setIsResetDialogOpen(false);
  };

  return (
    <div className="flex h-screen max-w-full flex-col overflow-hidden overflow-x-hidden bg-slate-950">
      <TopToolbar viewport={viewport} onViewportChange={setViewport} onExport={() => setIsExportOpen(true)} onReset={() => setIsResetDialogOpen(true)} />
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <ErrorBoundary title="Element Tree could not render" resetKey={`${tree.id}:${selectedNode.id}`}>
          <ElementTree tree={tree} selectedId={selectedNode.id} selectedNode={selectedNode} onSelect={setSelectedId} onAddElement={handleAddElement} />
        </ErrorBoundary>
        <ErrorBoundary title="Canvas preview could not render" resetKey={`${tree.id}:${viewport}:${selectedNode.id}`}>
          <CanvasPreview tree={tree} viewport={viewport} selectedId={selectedNode.id} onSelect={setSelectedId} onMoveElement={handleMoveElementToDropPosition} />
        </ErrorBoundary>
        <ErrorBoundary title="Inspector could not render" resetKey={`${tree.id}:${viewport}:${selectedNode.id}`}>
          <InspectorPanel
            node={selectedNode}
            parent={selectedParent}
            tree={tree}
            viewport={viewport}
            canDelete={canDeleteSelected}
            canDuplicate={canDuplicateSelected}
            canMoveUp={canMoveSelectedUp}
            canMoveDown={canMoveSelectedDown}
            onDuplicate={handleDuplicateSelected}
            onDelete={handleDeleteSelected}
            onMove={handleMoveSelected}
            onNameChange={handleNameChange}
            onStyleChange={handleStyleChange}
            onPropsChange={handlePropsChange}
            onAnimationChange={handleAnimationChange}
            onSuggestMobile={handleSuggestMobile}
          />
        </ErrorBoundary>
      </div>
      {isExportOpen && <CodeExportModal tree={tree} onClose={() => setIsExportOpen(false)} />}
      {isResetDialogOpen && <ResetConfirmationDialog onCancel={() => setIsResetDialogOpen(false)} onConfirm={handleConfirmReset} />}
    </div>
  );
}
