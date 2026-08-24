"use client"

import { Database, CheckCircle2, Layers, ShieldOff } from "lucide-react"
import type { ModelDefinition } from "@/lib/models-catalog"

export function DataRequirements({ model }: { model: ModelDefinition }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Database className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Data You Need to Contribute</h3>
      </div>

      <div className="grid grid-cols-1 gap-px bg-slate-100 md:grid-cols-2">
        {/* Input spec */}
        <div className="bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <Layers className="h-3.5 w-3.5" />
            Input Tensor
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Resolution</dt>
              <dd className="font-mono text-slate-800">{model.input.resolution}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Channels</dt>
              <dd className="font-mono text-slate-800">{model.input.channels}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">File format</dt>
              <dd className="font-mono text-slate-800">{model.input.format}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Min. samples</dt>
              <dd className="font-mono text-slate-800">{model.minSamples.toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        {/* Eligibility requirements */}
        <div className="bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Eligibility Checklist
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {model.dataRequirements.map((req) => (
              <li key={req.label} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                <span className="text-slate-600">
                  <span className="font-medium text-slate-800">{req.label}:</span> {req.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Preprocessing */}
      <div className="border-t border-slate-100 p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Local preprocessing (runs on your machine)</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {model.preprocessing.map((step, i) => (
            <span
              key={step}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600"
            >
              <span className="font-mono text-[10px] text-slate-400">{i + 1}</span>
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-2.5 border-t border-slate-100 bg-emerald-50/50 p-5">
        <ShieldOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
        <p className="text-sm leading-relaxed text-emerald-800">
          <span className="font-semibold">Your images never leave your hospital.</span> Preprocessing and training run
          locally; only differentially-private weight deltas are shared with the coordinator, and each is screened by the
          Multi-Krum defense before it can affect the global model.
        </p>
      </div>
    </div>
  )
}
