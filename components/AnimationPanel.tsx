import type { ReactNode } from "react";
import type { AnimationConfig } from "@/lib/types";
import { animationTypeOptions, easeOptions, triggerOptions } from "@/lib/styleUtils";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-600">
      {label}
      {children}
    </label>
  );
}

const inputClass = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100";

export function AnimationPanel({ animation, onChange, hasChildren }: { animation: AnimationConfig; onChange: (patch: Partial<AnimationConfig>) => void; hasChildren: boolean }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-slate-950">Animation</h3>
        <p className="text-xs text-slate-500">Configure a focused GSAP entrance or interaction.</p>
      </div>
      <div className="grid gap-3">
        <Field label="Animation type">
          <select className={inputClass} value={animation.type} onChange={(event) => onChange({ type: event.target.value as AnimationConfig["type"] })}>
            {animationTypeOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Trigger">
          <select className={inputClass} value={animation.trigger} onChange={(event) => onChange({ trigger: event.target.value as AnimationConfig["trigger"] })}>
            {triggerOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration">
            <input className={inputClass} type="number" min="0" step="0.1" value={animation.duration} onChange={(event) => onChange({ duration: Number(event.target.value) })} />
          </Field>
          <Field label="Delay">
            <input className={inputClass} type="number" min="0" step="0.05" value={animation.delay} onChange={(event) => onChange({ delay: Number(event.target.value) })} />
          </Field>
        </div>
        <Field label="Ease">
          <select className={inputClass} value={animation.ease} onChange={(event) => onChange({ ease: event.target.value })}>
            {easeOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </Field>
        <Field label={`Stagger${hasChildren ? "" : " (no children)"}`}>
          <input className={inputClass} disabled={!hasChildren} type="number" min="0" step="0.01" value={animation.stagger ?? 0} onChange={(event) => onChange({ stagger: Number(event.target.value) })} />
        </Field>
      </div>
    </section>
  );
}
