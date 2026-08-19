import type { AnimationConfig, ElementNode, ElementType } from "./types";
import { SAFETY_LIMITS, safeChildren } from "./safety";

export type AddableElementType = Exclude<ElementType, "section">;
export type MoveDirection = "up" | "down";

export const ADDABLE_ELEMENT_TYPES: AddableElementType[] = [
  "div",
  "header",
  "main",
  "footer",
  "nav",
  "article",
  "aside",
  "heading",
  "paragraph",
  "span",
  "link",
  "button",
  "image",
  "list",
  "listItem",
  "form",
  "label",
  "input",
  "textarea",
];

const CHILD_CAPABLE_ELEMENT_TYPES = new Set<ElementType>(["section", "div", "header", "main", "footer", "nav", "article", "aside", "form", "list", "listItem", "link", "button"]);

let generatedIdCount = 0;

const defaultAnimation: AnimationConfig = {
  type: "none",
  trigger: "page-load",
  duration: 0.8,
  delay: 0,
  ease: "power3.out",
  stagger: 0,
};

export type TreeMutationResult = {
  tree: ElementNode;
  selectedId: string;
};

export function generateNodeId(type: ElementType): string {
  generatedIdCount += 1;
  return `${type}-${Date.now().toString(36)}-${generatedIdCount}`;
}

function createListItemNode(text = "List item", id = generateNodeId("listItem")): ElementNode {
  return {
    id,
    type: "listItem",
    name: "list item",
    props: { text },
    styles: {
      desktop: {
        width: "w-full",
        padding: "p-0",
        margin: "m-0",
        fontSize: "text-base",
        fontWeight: "font-normal",
        background: "bg-transparent",
        textColor: "text-slate-300",
        opacity: 1,
        overflow: "visible",
      },
    },
    animation: { ...defaultAnimation },
    children: [],
  };
}

export function createDefaultNode(type: AddableElementType): ElementNode {
  const id = generateNodeId(type);

  const defaults: Record<AddableElementType, ElementNode> = {
    div: {
      id,
      type: "div",
      name: "div",
      props: {},
      styles: {
        desktop: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
          alignItems: "stretch",
          position: "relative",
          width: "w-full",
          padding: "p-6",
          margin: "m-0",
          gap: "gap-4",
          borderRadius: "rounded-2xl",
          background: "bg-slate-800/60",
          textColor: "text-white",
          opacity: 1,
          overflow: "visible",
        },
        mobile: { padding: "p-4", gap: "gap-3" },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    header: {
      id,
      type: "header",
      name: "header",
      props: {},
      styles: {
        desktop: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "between",
          alignItems: "center",
          position: "relative",
          width: "w-full",
          padding: "px-6 py-4",
          margin: "m-0",
          gap: "gap-4",
          borderRadius: "rounded-2xl",
          border: "border border-white/10",
          background: "bg-white/10",
          textColor: "text-white",
          opacity: 1,
          overflow: "visible",
        },
        mobile: { flexDirection: "column", alignItems: "start", padding: "p-4" },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    main: {
      id,
      type: "main",
      name: "main",
      props: {},
      styles: {
        desktop: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
          alignItems: "stretch",
          position: "relative",
          width: "w-full",
          padding: "p-6",
          margin: "m-0",
          gap: "gap-6",
          borderRadius: "rounded-none",
          background: "bg-transparent",
          textColor: "text-white",
          opacity: 1,
          overflow: "visible",
        },
        mobile: { padding: "p-4", gap: "gap-4" },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    footer: {
      id,
      type: "footer",
      name: "footer",
      props: {},
      styles: {
        desktop: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          width: "w-full",
          padding: "px-6 py-6",
          margin: "m-0",
          gap: "gap-4",
          borderRadius: "rounded-2xl",
          border: "border border-white/10",
          background: "bg-white/10",
          textColor: "text-slate-500",
          opacity: 1,
          overflow: "visible",
        },
        mobile: { padding: "p-4" },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    nav: {
      id,
      type: "nav",
      name: "nav",
      props: {},
      styles: {
        desktop: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "start",
          alignItems: "center",
          position: "relative",
          width: "w-fit",
          padding: "p-0",
          margin: "m-0",
          gap: "gap-4",
          borderRadius: "rounded-none",
          background: "bg-transparent",
          textColor: "text-white",
          opacity: 1,
          overflow: "visible",
        },
        mobile: { flexDirection: "column", alignItems: "start", width: "w-full" },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    article: {
      id,
      type: "article",
      name: "article",
      props: {},
      styles: {
        desktop: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
          alignItems: "stretch",
          position: "relative",
          width: "w-full",
          padding: "p-6",
          margin: "m-0",
          gap: "gap-4",
          borderRadius: "rounded-2xl",
          border: "border border-white/10",
          background: "bg-white/10",
          textColor: "text-white",
          opacity: 1,
          overflow: "visible",
        },
        mobile: { padding: "p-4" },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    aside: {
      id,
      type: "aside",
      name: "aside",
      props: {},
      styles: {
        desktop: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
          alignItems: "stretch",
          position: "relative",
          width: "w-full",
          padding: "p-4",
          margin: "m-0",
          gap: "gap-4",
          borderRadius: "rounded-xl",
          border: "border border-white/10",
          background: "bg-white/10",
          textColor: "text-white",
          opacity: 1,
          overflow: "visible",
        },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    heading: {
      id,
      type: "heading",
      name: "heading",
      props: { text: "New heading", headingLevel: 2 },
      styles: {
        desktop: {
          display: "block",
          width: "w-full",
          padding: "p-0",
          margin: "m-0",
          fontSize: "text-4xl",
          fontWeight: "font-bold",
          background: "bg-transparent",
          textColor: "text-slate-950",
          opacity: 1,
          overflow: "visible",
        },
        mobile: { fontSize: "text-2xl" },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    paragraph: {
      id,
      type: "paragraph",
      name: "paragraph",
      props: { text: "Add supporting copy for this section." },
      styles: {
        desktop: {
          display: "block",
          width: "w-full",
          padding: "p-0",
          margin: "m-0",
          fontSize: "text-base",
          fontWeight: "font-normal",
          background: "bg-transparent",
          textColor: "text-slate-600",
          opacity: 1,
          overflow: "visible",
        },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    span: {
      id,
      type: "span",
      name: "span",
      props: { text: "Inline text" },
      styles: {
        desktop: {
          display: "block",
          width: "w-fit",
          padding: "p-0",
          margin: "m-0",
          fontSize: "text-base",
          fontWeight: "font-normal",
          background: "bg-transparent",
          textColor: "text-slate-700",
          opacity: 1,
          overflow: "visible",
        },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    link: {
      id,
      type: "link",
      name: "link",
      props: { text: "Link", href: "#", target: "_self" },
      styles: {
        desktop: {
          display: "block",
          width: "w-fit",
          padding: "p-0",
          margin: "m-0",
          fontSize: "text-base",
          fontWeight: "font-semibold",
          background: "bg-transparent",
          textColor: "text-cyan-300",
          customClassName: "underline underline-offset-4",
          opacity: 1,
          overflow: "visible",
        },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    button: {
      id,
      type: "button",
      name: "button",
      props: { text: "Button", buttonType: "button" },
      styles: {
        desktop: {
          display: "block",
          width: "w-fit",
          padding: "px-5 py-3",
          margin: "m-0",
          borderRadius: "rounded-full",
          fontSize: "text-base",
          fontWeight: "font-semibold",
          background: "bg-cyan-300",
          textColor: "text-slate-950",
          opacity: 1,
          overflow: "visible",
        },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    image: {
      id,
      type: "image",
      name: "image placeholder",
      props: { alt: "Generated visual placeholder" },
      styles: {
        desktop: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          width: "w-full",
          padding: "p-8",
          margin: "m-0",
          gap: "gap-4",
          borderRadius: "rounded-3xl",
          background: "bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500",
          textColor: "text-white",
          opacity: 1,
          overflow: "hidden",
        },
        mobile: { padding: "p-6" },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    list: {
      id,
      type: "list",
      name: "list",
      props: { listType: "unordered" },
      styles: {
        desktop: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
          alignItems: "stretch",
          position: "relative",
          width: "w-full",
          padding: "pl-6",
          margin: "m-0",
          gap: "gap-2",
          borderRadius: "rounded-none",
          background: "bg-transparent",
          textColor: "text-slate-300",
          customClassName: "list-disc",
          opacity: 1,
          overflow: "visible",
        },
      },
      animation: { ...defaultAnimation },
      children: [createListItemNode("First item"), createListItemNode("Second item"), createListItemNode("Third item")],
    },
    listItem: createListItemNode("List item", id),
    form: {
      id,
      type: "form",
      name: "form",
      props: { action: "", method: "post" },
      styles: {
        desktop: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "start",
          alignItems: "stretch",
          position: "relative",
          width: "w-full",
          padding: "p-6",
          margin: "m-0",
          gap: "gap-4",
          borderRadius: "rounded-2xl",
          border: "border border-white/10",
          background: "bg-white/10",
          textColor: "text-white",
          opacity: 1,
          overflow: "visible",
        },
        mobile: { padding: "p-4", gap: "gap-3" },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    label: {
      id,
      type: "label",
      name: "label",
      props: { text: "Label", htmlFor: "" },
      styles: {
        desktop: {
          display: "block",
          width: "w-full",
          padding: "p-0",
          margin: "m-0",
          fontSize: "text-sm",
          fontWeight: "font-medium",
          background: "bg-transparent",
          textColor: "text-slate-300",
          opacity: 1,
          overflow: "visible",
        },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    input: {
      id,
      type: "input",
      name: "input",
      props: { placeholder: "Enter text...", inputType: "text", name: "" },
      styles: {
        desktop: {
          display: "block",
          width: "w-full",
          padding: "px-5 py-3",
          margin: "m-0",
          borderRadius: "rounded-xl",
          border: "border border-slate-200",
          background: "bg-white",
          textColor: "text-slate-950",
          opacity: 1,
          overflow: "visible",
        },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
    textarea: {
      id,
      type: "textarea",
      name: "textarea",
      props: { placeholder: "Write something...", name: "", rows: 4 },
      styles: {
        desktop: {
          display: "block",
          width: "w-full",
          padding: "p-4",
          margin: "m-0",
          borderRadius: "rounded-xl",
          border: "border border-slate-200",
          background: "bg-white",
          textColor: "text-slate-950",
          opacity: 1,
          overflow: "visible",
        },
      },
      animation: { ...defaultAnimation },
      children: [],
    },
  };

  return defaults[type];
}

export function canHaveChildren(node: ElementNode): boolean {
  return CHILD_CAPABLE_ELEMENT_TYPES.has(node.type);
}

export function findNodeById(tree: ElementNode, id: string, visited = new Set<string>(), depth = 0): ElementNode | null {
  if (!tree || depth > SAFETY_LIMITS.treeDepth) return null;
  if (tree.id && visited.has(tree.id)) return null;
  if (tree.id) visited.add(tree.id);
  if (tree.id === id) return tree;
  for (const child of safeChildren(tree)) {
    const found = findNodeById(child, id, visited, depth + 1);
    if (found) return found;
  }
  return null;
}

export function findParentNode(tree: ElementNode, childId: string, visited = new Set<string>(), depth = 0): ElementNode | null {
  if (!tree || depth > SAFETY_LIMITS.treeDepth) return null;
  if (tree.id && visited.has(tree.id)) return null;
  if (tree.id) visited.add(tree.id);
  const children = safeChildren(tree);
  if (children.some((child) => child.id === childId)) return tree;
  for (const child of children) {
    const found = findParentNode(child, childId, visited, depth + 1);
    if (found) return found;
  }
  return null;
}

export function updateNodeById(tree: ElementNode, id: string, updater: (node: ElementNode) => ElementNode, visited = new Set<string>(), depth = 0): ElementNode {
  if (!tree || depth > SAFETY_LIMITS.treeDepth) return tree;
  if (tree.id && visited.has(tree.id)) return tree;
  if (tree.id) visited.add(tree.id);
  if (tree.id === id) return updater(tree);
  return {
    ...tree,
    children: safeChildren(tree).map((child) => updateNodeById(child, id, updater, new Set(visited), depth + 1)),
  };
}

export function addNodeToTree(tree: ElementNode, selectedId: string, newNode: ElementNode): TreeMutationResult {
  const selectedNode = findNodeById(tree, selectedId);
  if (!selectedNode) return { tree, selectedId };

  if (canHaveChildren(selectedNode)) {
    return {
      tree: updateNodeById(tree, selectedId, (node) => ({ ...node, children: [...safeChildren(node), newNode] })),
      selectedId: newNode.id,
    };
  }

  const parent = findParentNode(tree, selectedId);
  if (!parent) return { tree, selectedId };

  return {
    tree: updateNodeById(tree, parent.id, (node) => {
      const children = safeChildren(node);
      const selectedIndex = children.findIndex((child) => child.id === selectedId);
      if (selectedIndex < 0) return node;
      return {
        ...node,
        children: [...children.slice(0, selectedIndex + 1), newNode, ...children.slice(selectedIndex + 1)],
      };
    }),
    selectedId: newNode.id,
  };
}

export function deleteNodeById(tree: ElementNode, id: string): TreeMutationResult {
  if (tree.id === id) return { tree, selectedId: tree.id };

  const parent = findParentNode(tree, id);
  if (!parent) return { tree, selectedId: tree.id };

  return {
    tree: updateNodeById(tree, parent.id, (node) => ({ ...node, children: safeChildren(node).filter((child) => child.id !== id) })),
    selectedId: parent.id,
  };
}

export function regenerateIdsRecursive(node: ElementNode, visited = new Set<string>(), depth = 0): ElementNode {
  if (!node || depth > SAFETY_LIMITS.treeDepth || (node.id && visited.has(node.id))) {
    return {
      ...node,
      id: generateNodeId(node?.type ?? "div"),
      name: `${node?.name ?? "element"} copy`,
      children: [],
    };
  }
  if (node.id) visited.add(node.id);
  return {
    ...node,
    id: generateNodeId(node.type),
    name: `${node.name} copy`,
    children: safeChildren(node).map((child) => regenerateIdsRecursive(child, new Set(visited), depth + 1)),
  };
}

export function duplicateNodeById(tree: ElementNode, id: string): TreeMutationResult {
  if (tree.id === id) return { tree, selectedId: id };

  const nodeToDuplicate = findNodeById(tree, id);
  const parent = findParentNode(tree, id);
  if (!nodeToDuplicate || !parent) return { tree, selectedId: id };

  const duplicatedNode = regenerateIdsRecursive(nodeToDuplicate);

  return {
    tree: updateNodeById(tree, parent.id, (node) => {
      const children = safeChildren(node);
      const selectedIndex = children.findIndex((child) => child.id === id);
      if (selectedIndex < 0) return node;
      return {
        ...node,
        children: [...children.slice(0, selectedIndex + 1), duplicatedNode, ...children.slice(selectedIndex + 1)],
      };
    }),
    selectedId: duplicatedNode.id,
  };
}

export function moveNode(tree: ElementNode, id: string, direction: MoveDirection): TreeMutationResult {
  const parent = findParentNode(tree, id);
  if (!parent) return { tree, selectedId: id };

  const parentChildren = safeChildren(parent);
  const currentIndex = parentChildren.findIndex((child) => child.id === id);
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= parentChildren.length) return { tree, selectedId: id };

  return {
    tree: updateNodeById(tree, parent.id, (node) => {
      const children = [...safeChildren(node)];
      const [movedNode] = children.splice(currentIndex, 1);
      children.splice(nextIndex, 0, movedNode);
      return { ...node, children };
    }),
    selectedId: id,
  };
}

export function moveNodeToSiblingIndex(tree: ElementNode, id: string, targetIndex: number): TreeMutationResult {
  const parent = findParentNode(tree, id);
  if (!parent) return { tree, selectedId: id };

  return moveNodeToParentIndex(tree, id, parent.id, targetIndex);
}

export function moveNodeToParentIndex(tree: ElementNode, id: string, targetParentId: string, targetIndex: number): TreeMutationResult {
  if (tree.id === id || id === targetParentId) return { tree, selectedId: id };

  const movedNode = findNodeById(tree, id);
  const sourceParent = findParentNode(tree, id);
  const targetParent = findNodeById(tree, targetParentId);
  if (!movedNode || !sourceParent || !targetParent || !canHaveChildren(targetParent)) return { tree, selectedId: id };

  // A node cannot be moved into one of its own descendants.
  if (findNodeById(movedNode, targetParentId)) return { tree, selectedId: id };

  const parentChildren = safeChildren(sourceParent);
  const currentIndex = parentChildren.findIndex((child) => child.id === id);
  if (currentIndex < 0) return { tree, selectedId: id };

  if (sourceParent.id === targetParent.id) {
    const siblingCountWithoutMovedNode = parentChildren.length - 1;
    const safeTargetIndex = Math.max(0, Math.min(Math.round(targetIndex), siblingCountWithoutMovedNode));
    if (safeTargetIndex === currentIndex) return { tree, selectedId: id };

    return {
      tree: updateNodeById(tree, sourceParent.id, (node) => {
        const children = [...safeChildren(node)];
        const [nextMovedNode] = children.splice(currentIndex, 1);
        children.splice(safeTargetIndex, 0, nextMovedNode);
        return { ...node, children };
      }),
      selectedId: id,
    };
  }

  const treeWithoutMovedNode = updateNodeById(tree, sourceParent.id, (node) => ({
    ...node,
    children: safeChildren(node).filter((child) => child.id !== id),
  }));
  const nextTargetParent = findNodeById(treeWithoutMovedNode, targetParentId);
  if (!nextTargetParent) return { tree, selectedId: id };

  const safeTargetIndex = Math.max(0, Math.min(Math.round(targetIndex), safeChildren(nextTargetParent).length));

  return {
    tree: updateNodeById(treeWithoutMovedNode, targetParentId, (node) => {
      const children = [...safeChildren(node)];
      children.splice(safeTargetIndex, 0, movedNode);
      return { ...node, children };
    }),
    selectedId: id,
  };
}

export function mapTree(tree: ElementNode, mapper: (node: ElementNode) => ElementNode, visited = new Set<string>(), depth = 0): ElementNode {
  if (!tree || depth > SAFETY_LIMITS.treeDepth) return tree;
  if (tree.id && visited.has(tree.id)) return tree;
  if (tree.id) visited.add(tree.id);
  const mapped = mapper(tree);
  return {
    ...mapped,
    children: safeChildren(mapped).map((child) => mapTree(child, mapper, new Set(visited), depth + 1)),
  };
}

export function flattenTree(tree: ElementNode, visited = new Set<string>(), depth = 0): ElementNode[] {
  if (!tree || depth > SAFETY_LIMITS.treeDepth || visited.size > SAFETY_LIMITS.maxFlattenedNodes) return [];
  if (tree.id && visited.has(tree.id)) return [];
  if (tree.id) visited.add(tree.id);
  return [tree, ...safeChildren(tree).flatMap((child) => flattenTree(child, visited, depth + 1))].slice(0, SAFETY_LIMITS.maxFlattenedNodes);
}

export function cloneTree(tree: ElementNode): ElementNode {
  try {
    return structuredClone(tree);
  } catch {
    return JSON.parse(JSON.stringify(tree)) as ElementNode;
  }
}
