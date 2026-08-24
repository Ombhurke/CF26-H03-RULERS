"use client"

import { useState } from "react"
import { ArrowLeft, Cpu, Building2, MapPin, LayoutGrid, Database, GraduationCap, AlertTriangle } from "lucide-react"
import type { ModelDefinition } from "@/lib/models-catalog"
import type { SiteState } from "@/lib/marketplace-store"
import { useModelState } from "@/hooks/use-marketplace"
import { MetricCards } from "./metric-cards"
import { ConvergenceChart } from "./convergence-chart"
import { DataRequirements } from "./data-requirements"
import { TrainingPanel } from "./training-panel"

type Section = "overview" | "data" | "train"

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "data", label: "Data Requirements", icon: <Database className="h-4 w-4" /> },
  { id: "train", label: "Train Model", icon: <GraduationCap className="h-4 w-4" /> },
]

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  )
}

function HospitalsPanel({ model, sites }: { model: ModelDefinition; sites: SiteState[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <Building2 className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-900">Participating Hospitals</h3>
        <span className="ml-auto text-xs text-slate-500">{model.hospitals.length} sites contributing data</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {sites.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-3.5">
            <span
              className={`inline-flex h-9 w-11 items-center justify-center rounded-lg text-xs font-semibold ${
                s.status === "filtered"
                  ? "bg-rose-100 text-rose-700"
                  : s.status === "harmonized"
                    ? "bg-amber-100 text-amber-700"
                    : s.adversarial
                      ? "bg-slate-100 text-slate-600"
                      : "bg-indigo-100 text-indigo-700"
              }`}
            >
              {s.code}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                <span className="truncate">{s.name}</span>
                {s.adversarial && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                    <AlertTriangle className="h-2.5 w-2.5" /> Unverified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3" />
                {s.region} · {s.scanner}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-slate-700">{s.samples.toLocaleString()}</div>
              <div className="text-[11px] text-slate-400">studies</div>
            </div>
            <span
              className={`ml-2 hidden rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:inline-flex ${
                s.status === "filtered"
                  ? "bg-rose-50 text-rose-600"
                  : s.status === "harmonized"
                    ? "bg-amber-50 text-amber-600"
                    : s.status === "synced"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
              }`}
            >
              {s.status === "idle" ? "ready" : s.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ModelOverview({ model, onBack }: { model: ModelDefinition; onBack: () => void }) {
  const state = useModelState(model.id)
  const [section, setSection] = useState<Section>("overview")

  if (!state) return null

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to marketplace
      </button>

      {/* Model header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">{model.name}</h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">{model.shortName}</span>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 text-pretty">{model.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span className="font-medium text-slate-700">{model.modality}</span>
              <span className="text-slate-300">·</span>
              <span>{model.task}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            aria-current={section === s.id ? "page" : undefined}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              section === s.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {section === "overview" && (
        <div className="space-y-4">
          <MetricCards state={state} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ConvergenceChart state={state} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Cpu className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Architecture</span>
              </div>
              <dl className="mt-2 divide-y divide-slate-100">
                <SpecRow label="Backbone" value={model.architecture} />
                <SpecRow label="Parameters" value={model.parameters} />
                <SpecRow label="Input" value={model.input.resolution} />
                <SpecRow label="Classes" value={String(model.classes.length)} />
                <SpecRow label="Target AUC" value={`${(model.targetAccuracy * 100).toFixed(0)}%`} />
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {model.classes.map((c) => (
                  <span key={c} className="rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <HospitalsPanel model={model} sites={state.sites} />
        </div>
      )}

      {section === "data" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DataRequirements model={model} />
          </div>
          <HospitalsPanel model={model} sites={state.sites} />
        </div>
      )}

      {section === "train" && <TrainingPanel model={model} state={state} />}
    </div>
  )
}
