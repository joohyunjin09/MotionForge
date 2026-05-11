import type { Viewport } from "@/lib/types";

const viewportLabels: Record<Viewport, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

export function TopToolbar({
  viewport,
  onViewportChange,
  onExport,
  onReset,
}: {
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
  onExport: () => void;
  onReset: () => void;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-5 text-white">
      <div>
        <h1 className="text-lg font-bold tracking-tight">MotionForge</h1>
        <p className="text-xs text-slate-400">React + Tailwind + GSAP section builder</p>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-slate-900 p-1">
        {(Object.keys(viewportLabels) as Viewport[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onViewportChange(item)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              viewport === item ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {viewportLabels[item]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={onExport} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-100">
          Export Code
        </button>
        <button type="button" onClick={onReset} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900">
          Reset
        </button>
      </div>
    </header>
  );
}
