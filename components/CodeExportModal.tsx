import { generateGSAPCode, generateReactCode } from "@/lib/codegen";
import type { ElementNode } from "@/lib/types";

export function CodeExportModal({ tree, onClose }: { tree: ElementNode; onClose: () => void }) {
  const reactCode = generateReactCode(tree);
  const gsapCode = generateGSAPCode(tree);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Export generated code</h2>
            <p className="text-sm text-slate-500">Copy this production-friendly React, Tailwind, and GSAP component into your app.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            Close
          </button>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[1fr_0.65fr]">
          <section className="min-h-0 overflow-auto p-5 motionforge-scrollbar">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-950">MotionForgeHero.tsx</h3>
              <button type="button" onClick={() => navigator.clipboard.writeText(reactCode)} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                Copy React Code
              </button>
            </div>
            <pre data-testid="react-code" className="overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100 motionforge-scrollbar"><code>{reactCode}</code></pre>
          </section>
          <section className="min-h-0 overflow-auto border-l border-slate-200 bg-slate-50 p-5 motionforge-scrollbar">
            <h3 className="mb-3 font-semibold text-slate-950">GSAP logic only</h3>
            <pre data-testid="gsap-code" className="overflow-auto rounded-2xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100 motionforge-scrollbar"><code>{gsapCode}</code></pre>
          </section>
        </div>
      </div>
    </div>
  );
}
