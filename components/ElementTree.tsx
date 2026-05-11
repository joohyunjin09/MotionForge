import type { ElementNode } from "@/lib/types";
import { ADDABLE_ELEMENT_TYPES, canHaveChildren, type AddableElementType } from "@/lib/treeUtils";

const elementLabels: Record<AddableElementType, string> = {
  div: "Div",
  heading: "Heading",
  paragraph: "Paragraph",
  button: "Button",
  image: "Image placeholder",
};

function TreeNode({
  node,
  selectedId,
  onSelect,
  onQuickAdd,
  depth = 0,
}: {
  node: ElementNode;
  selectedId: string;
  onSelect: (id: string) => void;
  onQuickAdd: (type: AddableElementType, targetId: string) => void;
  depth?: number;
}) {
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div className="relative">
      {depth > 0 && <span className="absolute bottom-0 top-0 w-px bg-slate-800" style={{ left: `${10 + (depth - 1) * 16}px` }} />}
      <div className="group flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className={`flex min-w-0 flex-1 items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
            isSelected ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"
          }`}
          style={{ marginLeft: `${depth * 16}px` }}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${hasChildren ? "bg-cyan-300" : "bg-slate-600"}`} />
            <span className="truncate">{node.name}</span>
          </span>
          <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase ${isSelected ? "bg-slate-950/10" : "bg-slate-800 text-slate-400"}`}>{node.type}</span>
        </button>
        {canHaveChildren(node) && (
          <button
            type="button"
            title={`Add div inside ${node.name}`}
            onClick={() => onQuickAdd("div", node.id)}
            className="hidden h-8 w-8 shrink-0 rounded-lg border border-slate-800 text-slate-400 transition hover:border-cyan-300 hover:text-cyan-300 group-hover:block"
          >
            +
          </button>
        )}
      </div>
      {node.children.map((child) => (
        <TreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} onQuickAdd={onQuickAdd} depth={depth + 1} />
      ))}
    </div>
  );
}

export function ElementTree({
  tree,
  selectedId,
  selectedNode,
  onSelect,
  onAddElement,
}: {
  tree: ElementNode;
  selectedId: string;
  selectedNode: ElementNode | null;
  onSelect: (id: string) => void;
  onAddElement: (type: AddableElementType, targetId?: string) => void;
}) {
  const addMode = selectedNode && canHaveChildren(selectedNode) ? "child" : "sibling";

  return (
    <aside className="flex w-80 flex-col border-r border-slate-800 bg-slate-950 p-4 text-white">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Element Builder</h2>
        <p className="mt-1 text-xs text-slate-400">Add, select, and organize the hero section tree.</p>
      </div>

      <section className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Add Element</h3>
            <p className="text-xs text-slate-500">Creates a {addMode} of the selection.</p>
          </div>
          <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase text-cyan-300">{addMode}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ADDABLE_ELEMENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onAddElement(type)}
              className="rounded-lg border border-slate-800 px-3 py-2 text-left text-xs font-semibold text-slate-300 transition hover:border-cyan-300 hover:bg-slate-800 hover:text-white"
            >
              {elementLabels[type]}
            </button>
          ))}
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-auto motionforge-scrollbar">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">Element Tree</h3>
          <span className="text-xs text-slate-500">{selectedNode?.name ?? "None"} selected</span>
        </div>
        <div className="space-y-1 pr-1">
          <TreeNode node={tree} selectedId={selectedId} onSelect={onSelect} onQuickAdd={(type, targetId) => onAddElement(type, targetId)} />
        </div>
      </section>
    </aside>
  );
}
