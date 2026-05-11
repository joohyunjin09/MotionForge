import type { AnimationConfig, ElementNode, ElementType } from "./types";

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

export function createDefaultNode(type: Exclude<ElementType, "section">): ElementNode {
  const id = generateNodeId(type);

  const defaults: Record<Exclude<ElementType, "section">, ElementNode> = {
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
          width: "full",
          padding: "p-6",
          margin: "m-0",
          gap: "gap-4",
          borderRadius: "rounded-2xl",
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
    heading: {
      id,
      type: "heading",
      name: "heading",
      props: { text: "New heading" },
      styles: {
        desktop: {
          display: "block",
          width: "full",
          padding: "p-0",
          margin: "m-0",
          fontSize: "text-4xl",
          fontWeight: "font-bold",
          background: "bg-transparent",
          textColor: "text-white",
          opacity: 1,
          overflow: "visible",
        },
        mobile: { fontSize: "text-2xl" },
      },
      animation: { ...defaultAnimation, type: "slide-up" },
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
          width: "full",
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
      animation: { ...defaultAnimation, type: "fade-in" },
      children: [],
    },
    button: {
      id,
      type: "button",
      name: "button",
      props: { text: "Click me" },
      styles: {
        desktop: {
          display: "block",
          width: "fit",
          padding: "px-6 py-3",
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
      animation: { ...defaultAnimation, type: "scale-in" },
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
          width: "full",
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
      animation: { ...defaultAnimation, type: "slide-left" },
      children: [],
    },
  };

  return defaults[type];
}

export function canHaveChildren(node: ElementNode): boolean {
  return node.type === "section" || node.type === "div" || node.type === "image";
}

export function findNodeById(tree: ElementNode, id: string): ElementNode | null {
  if (tree.id === id) return tree;
  for (const child of tree.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

export function findParentNode(tree: ElementNode, childId: string): ElementNode | null {
  if (tree.children.some((child) => child.id === childId)) return tree;
  for (const child of tree.children) {
    const found = findParentNode(child, childId);
    if (found) return found;
  }
  return null;
}

export function updateNodeById(tree: ElementNode, id: string, updater: (node: ElementNode) => ElementNode): ElementNode {
  if (tree.id === id) return updater(tree);
  return {
    ...tree,
    children: tree.children.map((child) => updateNodeById(child, id, updater)),
  };
}

export function addNodeToTree(tree: ElementNode, selectedId: string, newNode: ElementNode): TreeMutationResult {
  const selectedNode = findNodeById(tree, selectedId);
  if (!selectedNode) return { tree, selectedId: tree.id };

  if (canHaveChildren(selectedNode)) {
    return {
      tree: updateNodeById(tree, selectedId, (node) => ({ ...node, children: [...node.children, newNode] })),
      selectedId: newNode.id,
    };
  }

  const parent = findParentNode(tree, selectedId);
  if (!parent) return { tree, selectedId };

  return {
    tree: updateNodeById(tree, parent.id, (node) => {
      const selectedIndex = node.children.findIndex((child) => child.id === selectedId);
      return {
        ...node,
        children: [...node.children.slice(0, selectedIndex + 1), newNode, ...node.children.slice(selectedIndex + 1)],
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
    tree: updateNodeById(tree, parent.id, (node) => ({ ...node, children: node.children.filter((child) => child.id !== id) })),
    selectedId: parent.id,
  };
}

export function regenerateIdsRecursive(node: ElementNode): ElementNode {
  return {
    ...node,
    id: generateNodeId(node.type),
    name: `${node.name} copy`,
    children: node.children.map(regenerateIdsRecursive),
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
      const selectedIndex = node.children.findIndex((child) => child.id === id);
      return {
        ...node,
        children: [...node.children.slice(0, selectedIndex + 1), duplicatedNode, ...node.children.slice(selectedIndex + 1)],
      };
    }),
    selectedId: duplicatedNode.id,
  };
}

export function moveNode(tree: ElementNode, id: string, direction: "up" | "down"): TreeMutationResult {
  const parent = findParentNode(tree, id);
  if (!parent) return { tree, selectedId: id };

  const currentIndex = parent.children.findIndex((child) => child.id === id);
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= parent.children.length) return { tree, selectedId: id };

  return {
    tree: updateNodeById(tree, parent.id, (node) => {
      const children = [...node.children];
      const [movedNode] = children.splice(currentIndex, 1);
      children.splice(nextIndex, 0, movedNode);
      return { ...node, children };
    }),
    selectedId: id,
  };
}

export function mapTree(tree: ElementNode, mapper: (node: ElementNode) => ElementNode): ElementNode {
  const mapped = mapper(tree);
  return {
    ...mapped,
    children: mapped.children.map((child) => mapTree(child, mapper)),
  };
}

export function flattenTree(tree: ElementNode): ElementNode[] {
  return [tree, ...tree.children.flatMap(flattenTree)];
}

export function cloneTree(tree: ElementNode): ElementNode {
  return structuredClone(tree);
}
