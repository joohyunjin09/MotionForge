import type { ElementNode } from "./types";

export function findNodeById(tree: ElementNode, id: string): ElementNode | null {
  if (tree.id === id) return tree;
  for (const child of tree.children) {
    const found = findNodeById(child, id);
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
