import type { ElementNode } from "@/lib/types";

function TreeNode({ node, selectedId, onSelect, depth = 0 }: { node: ElementNode; selectedId: string; onSelect: (id: string) => void; depth?: number }) {
  const isSelected = selectedId === node.id;

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
          isSelected ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"
        }`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      >
        <span className="truncate">{node.name}</span>
        <span className="text-[10px] uppercase opacity-70">{node.type}</span>
      </button>
      {node.children.map((child) => (
        <TreeNode key={child.id} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}

export function ElementTree({ tree, selectedId, onSelect }: { tree: ElementNode; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <aside className="w-72 border-r border-slate-800 bg-slate-950 p-4 text-white">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Element Tree</h2>
        <p className="mt-1 text-xs text-slate-400">Select a hero element to edit its responsive styles.</p>
      </div>
      <div className="space-y-1">
        <TreeNode node={tree} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </aside>
  );
}
