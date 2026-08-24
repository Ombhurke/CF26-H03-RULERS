"use client"

import { ArrowUpRight, Building2, Users } from "lucide-react"
import type { ModelDefinition } from "@/lib/models-catalog"
import { useModelState } from "@/hooks/use-marketplace"

const MODALITY_STYLES: Record<string, string> = {
  "Chest X-ray": "bg-indigo-50 text-indigo-700 ring-indigo-100",
  Dermatoscopy: "bg-rose-50 text-rose-700 ring-rose-100",
  "Breast Ultrasound": "bg-violet-50 text-violet-700 ring-violet-100",
  "Retinal Fundus": "bg-amber-50 text-amber-700 ring-amber-100",
  "Blood Microscopy": "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "Abdominal CT": "bg-sky-50 text-sky-700 ring-sky-100",
}

const STATUS_STYLES: Record<string, string> = {
  recruiting: "bg-amber-50 text-amber-700",
  training: "bg-indigo-50 text-indigo-700",
  converged: "bg-emerald-50 text-emerald-700",
}

const STATUS_LABEL: Record<string, string> = {
  recruiting: "Recruiting sites",
  training: "Training live",
  converged: "Converged",
}

export function ModelCard({ model, onOpen }: { model: ModelDefinition; onOpen: (id: string) => void }) {
  const runtime = useModelState(model.id)
  const accuracy = runtime?.accuracy ?? model.baseAccuracy
  const round = runtime?.round ?? 0
  const isTraining = runtime?.isTraining ?? false
  const totalSamples = model.hospitals.reduce((s, h) => s + h.samples, 0)

  return (
    <button
      type="button"
      onClick={() => onOpen(model.id)}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${MODALITY_STYLES[model.modality] ?? "bg-slate-50 text-slate-600 ring-slate-100"}`}
        >
          {model.modality}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[model.status]}`}>
          {isTraining && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
          {isTraining ? "Training live" : STATUS_LABEL[model.status]}
        </span>
      </div>

      <div className="mt-4">
        <h3 className="text-base font-semibold tracking-tight text-slate-900">{model.name}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500">{model.summary}</p>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Global accuracy</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">{(accuracy * 100).toFixed(1)}%</span>
            <span className="text-xs text-slate-400">· rd {round}</span>
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="font-mono text-slate-700">{model.architecture.split(" ")[0]}</div>
          <div>{model.parameters} params</div>
        </div>
      </div>

      {/* Accuracy track */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${Math.min(100, ((accuracy - 0.5) / 0.5) * 100)}%` }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            {model.hospitals.length} hospitals
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {totalSamples.toLocaleString()} studies
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 group-hover:gap-1.5">
          Open
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </button>
  )
}
