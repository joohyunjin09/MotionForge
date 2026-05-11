"use client";

import { useMemo, useState } from "react";
import { CanvasPreview } from "./CanvasPreview";
import { CodeExportModal } from "./CodeExportModal";
import { ElementTree } from "./ElementTree";
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
  updateNodeById,
  type AddableElementType,
  type MoveDirection,
  type TreeMutationResult,
} from "@/lib/treeUtils";
import { getResolvedStyles, suggestMobileStyle } from "@/lib/styleUtils";

export function MotionForgeApp() {
  const [tree, setTree] = useState<ElementNode>(() => cloneTree(defaultTree));
  const [selectedId, setSelectedId] = useState(defaultTree.id);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [isExportOpen, setIsExportOpen] = useState(false);

  const selectedNode = useMemo(() => findNodeById(tree, selectedId), [tree, selectedId]);
  const selectedParent = useMemo(() => findParentNode(tree, selectedId), [tree, selectedId]);
  const selectedSiblingIndex = selectedParent?.children.findIndex((child) => child.id === selectedId) ?? -1;
  const canDeleteSelected = selectedId !== tree.id;
  const canDuplicateSelected = selectedId !== tree.id;
  const canMoveSelectedUp = selectedSiblingIndex > 0;
  const canMoveSelectedDown = Boolean(selectedParent && selectedSiblingIndex >= 0 && selectedSiblingIndex < selectedParent.children.length - 1);

  const updateSelectedNode = (updater: (node: ElementNode) => ElementNode) => {
    setTree((current) => updateNodeById(current, selectedId, updater));
  };

  const handleStyleChange = (patch: Partial<StyleConfig>) => {
    updateSelectedNode((node) => ({
      ...node,
      styles: {
        ...node.styles,
        [viewport]: {
          ...(viewport === "desktop" ? node.styles.desktop : node.styles[viewport]),
          ...patch,
        },
      },
    }));
  };

  const handlePropsChange = (patch: Partial<ElementNode["props"]>) => {
    updateSelectedNode((node) => ({ ...node, props: { ...node.props, ...patch } }));
  };

  const handleNameChange = (name: string) => {
    updateSelectedNode((node) => ({ ...node, name }));
  };

  const handleAnimationChange = (patch: Partial<AnimationConfig>) => {
    updateSelectedNode((node) => ({
      ...node,
      animation: {
        type: "none",
        trigger: "page-load",
        duration: 0.8,
        delay: 0,
        ease: "power3.out",
        stagger: 0,
        ...node.animation,
        ...patch,
      },
    }));
  };

  const applyTreeMutation = (mutation: TreeMutationResult) => {
    setTree(mutation.tree);
    setSelectedId(mutation.selectedId);
  };

  const handleAddElement = (type: AddableElementType, targetId = selectedId) => {
    const newNode = createDefaultNode(type);
    applyTreeMutation(addNodeToTree(tree, targetId, newNode));
  };

  const handleDuplicateSelected = () => {
    if (!canDuplicateSelected) return;
    applyTreeMutation(duplicateNodeById(tree, selectedId));
  };

  const handleDeleteSelected = () => {
    if (!canDeleteSelected) return;
    applyTreeMutation(deleteNodeById(tree, selectedId));
  };

  const handleMoveSelected = (direction: MoveDirection) => {
    if (direction === "up" && !canMoveSelectedUp) return;
    if (direction === "down" && !canMoveSelectedDown) return;
    applyTreeMutation(moveNode(tree, selectedId, direction));
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950">
      <TopToolbar viewport={viewport} onViewportChange={setViewport} onExport={() => setIsExportOpen(true)} onReset={handleReset} />
      <div className="flex min-h-0 flex-1">
        <ElementTree tree={tree} selectedId={selectedId} selectedNode={selectedNode} onSelect={setSelectedId} onAddElement={handleAddElement} />
        <CanvasPreview tree={tree} viewport={viewport} selectedId={selectedId} onSelect={setSelectedId} />
        <InspectorPanel
          node={selectedNode}
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
      </div>
      {isExportOpen && <CodeExportModal tree={tree} onClose={() => setIsExportOpen(false)} />}
    </div>
  );
}
