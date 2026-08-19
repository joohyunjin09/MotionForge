import type { ElementNode } from "@/lib/types";
import { canHaveChildren, type AddableElementType } from "@/lib/treeUtils";
import { safeChildren, safeElementName, safeElementType, SAFETY_LIMITS } from "@/lib/safety";

const elementLabels: Record<AddableElementType, string> = {
  div: "Div",
  header: "Header",
  main: "Main",
  footer: "Footer",
  nav: "Nav",
  article: "Article",
  aside: "Aside",
  heading: "Heading",
  paragraph: "Paragraph",
  span: "Span",
  link: "Link",
  button: "Button",
  image: "Image placeholder",
  list: "List",
  listItem: "List item",
  form: "Form",
  label: "Label",
  input: "Input",
  textarea: "Textarea",
};

const elementGroups: Array<{ label: string; types: AddableElementType[] }> = [
  { label: "Layout", types: ["div", "header", "main", "footer", "nav", "article", "aside"] },
  { label: "Text", types: ["heading", "paragraph", "span", "link"] },
  { label: "Media", types: ["image"] },
  { label: "List", types: ["list", "listItem"] },
  { label: "Form", types: ["form", "label", "input", "textarea", "button"] },
];

function TreeNode({
  node,
  selectedId,
  onSelect,
  depth = 0,
  visited = new Set<string>(),
}: {
  node: ElementNode;
  selectedId: string;
  onSelect: (id: string) => void;
  depth?: number;
  visited?: Set<string>;
}) {
  if (depth > SAFETY_LIMITS.treeDepth) {
    return <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Maximum tree depth reached.</div>;
  }

  if (node.id && visited.has(node.id)) {
    return <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">Invalid tree cycle detected.</div>;
  }

  const nextVisited = new Set(visited);
  if (node.id) nextVisited.add(node.id);
  const isSelected = selectedId === node.id;
  const children = safeChildren(node);
  const hasChildren = children.length > 0;
  const rowLineLeft = 10 + Math.max(depth - 1, 0) * 16;
  const nodeName = safeElementName(node.name);
  const typeLabel = safeElementType(node.type).toUpperCase();

  return (
    <div className="relative">
      {depth > 0 && <span className="absolute bottom-0 top-0 w-px bg-slate-800" style={{ left: `${rowLineLeft}px` }} />}
      <div className="group flex min-w-0 items-center gap-1">
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
            <span className="truncate">{nodeName}</span>
            {hasChildren && <span className={`shrink-0 text-[10px] ${isSelected ? "text-slate-700" : "text-slate-500"}`}>{children.length}</span>}
          </span>
          <span className={`ml-2 max-w-[5.5rem] shrink-0 truncate rounded-full px-2 py-0.5 text-[10px] uppercase ${isSelected ? "bg-slate-950/10" : "bg-slate-800 text-slate-400"}`}>
            {typeLabel}
          </span>
        </button>
      </div>
      {children.map((child, index) => (
        <TreeNode key={`${child.id ?? "missing"}-${index}`} node={child} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} visited={nextVisited} />
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
    <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-950 p-4 text-white">
      <div className="mb-4 shrink-0">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Element Builder</h2>
        <p className="mt-1 text-xs text-slate-400">Add, select, and organize the hero section tree.</p>
      </div>

      <section className="mb-4 shrink-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Add Element</h3>
            <p className="text-xs text-slate-500">Creates a {addMode} of the selection.</p>
          </div>
          <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] uppercase text-cyan-300">{addMode}</span>
        </div>
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1 motionforge-scrollbar">
          {elementGroups.map((group, index) => (
            <details key={group.label} className="rounded-xl border border-slate-800 bg-slate-950/40 p-2" open={index === 0}>
              <summary className="cursor-pointer select-none text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{group.label}</summary>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {group.types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    data-testid={`add-${type}`}
                    onClick={() => onAddElement(type)}
                    className="rounded-lg border border-slate-800 px-3 py-2 text-left text-xs font-semibold text-slate-300 transition hover:border-cyan-300 hover:bg-slate-800 hover:text-white"
                  >
                    {elementLabels[type]}
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/35 p-3">
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-100">Element Tree</h3>
          <span className="min-w-0 truncate text-xs text-slate-500">{selectedNode?.name ?? "None"} selected</span>
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-1 motionforge-scrollbar">
          <TreeNode
            node={tree}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </div>
      </section>
    </aside>
  );
}
