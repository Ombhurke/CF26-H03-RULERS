"use client"

import { useRef, useState } from "react"
import { Play, Loader2, ZapOff, Sliders, RotateCcw, ShieldCheck, GraduationCap, UploadCloud, FileCheck2, X } from "lucide-react"
import type { ModelDefinition } from "@/lib/models-catalog"
import type { ModelRuntimeState } from "@/lib/marketplace-store"
import { trainModel, toggleAttack, toggleDomainShift, resetModel } from "@/hooks/use-marketplace"

const STATUS_STYLES: Record<string, string> = {
  Success: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  Harmonized: "bg-blue-50 text-blue-600 ring-blue-200",
  Blocked: "bg-rose-50 text-rose-600 ring-rose-200",
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function ToggleButton({
  active,
  onClick,
  icon,
  children,
  activeClass,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
  activeClass: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
        active ? activeClass : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

export function TrainingPanel({ model, state }: { model: ModelDefinition; state: ModelRuntimeState }) {
  const [dataset, setDataset] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const done = state.round >= state.maxRounds
  const canTrain = Boolean(dataset) && !state.isTraining && !done

  function handleDatasetChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setDataset(file)
  }

  // Cycle the highlighted step through the guided list as rounds progress.
  const stepCount = model.trainingSteps.length
  const currentStep = state.round === 0 ? 0 : (state.round - 1) % stepCount

  return (
    <div className="space-y-4">
      {/* Guided steps */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <GraduationCap className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">How to Train This Model</h3>
        </div>
        <ol className="divide-y divide-slate-100">
          {model.trainingSteps.map((step, i) => {
            const active = state.isTraining && i === currentStep
            const complete = state.round > 0 && (i < currentStep || done)
            return (
              <li key={step.title} className="flex items-start gap-3 px-5 py-3.5">
                <span
                  className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    complete
                      ? "bg-emerald-100 text-emerald-700"
                      : active
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {i + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    {step.title}
                    {active && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />}
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{step.detail}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Local dataset */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <UploadCloud className="h-4 w-4 text-indigo-600" />
              Select your local training dataset
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
              Choose one file from this hospital&apos;s machine. The frontend uses it only to simulate a local training run;
              nothing is uploaded or shared.
            </p>
          </div>
          <input ref={fileInputRef} type="file" className="sr-only" onChange={handleDatasetChange} accept=".csv,.zip,.dcm,.dicom,.png,.jpg,.jpeg,.tif,.tiff" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
          >
            <UploadCloud className="h-4 w-4" />
            Choose dataset
          </button>
        </div>
        {dataset ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2 text-sm text-emerald-800">
              <FileCheck2 className="h-4 w-4 shrink-0" />
              <span className="truncate font-medium">{dataset.name}</span>
              <span className="shrink-0 text-xs text-emerald-600">{(dataset.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <button type="button" aria-label="Remove selected dataset" onClick={() => { setDataset(null); if (fileInputRef.current) fileInputRef.current.value = "" }} className="rounded-md p-1 text-emerald-700 hover:bg-emerald-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-indigo-200 bg-white/70 px-4 py-3 text-center text-xs text-slate-500">
            No dataset selected. Choose a compatible file to enable training.
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Contribute a training round</div>
            <div className="mt-0.5 text-xs text-slate-500">
              Runs local DP-SGD across all {state.sites.length} sites and aggregates the accepted deltas.
            </div>
          </div>
          <button
            type="button"
            onClick={() => trainModel(model.id, 10)}
            disabled={!canTrain}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state.isTraining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {done ? "Training complete" : state.isTraining ? `Training… ${state.roundsRemaining} left` : dataset ? "Train from this dataset" : "Select a dataset first"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="mr-1 text-xs font-medium text-slate-400">Simulate:</span>
          <ToggleButton
            active={state.attackInjected}
            onClick={() => toggleAttack(model.id)}
            icon={<ZapOff className="h-3.5 w-3.5" />}
            activeClass="border-rose-200 bg-rose-50 text-rose-600"
          >
            Data-poisoning attack
          </ToggleButton>
          <ToggleButton
            active={state.domainShift}
            onClick={() => toggleDomainShift(model.id)}
            icon={<Sliders className="h-3.5 w-3.5" />}
            activeClass="border-amber-200 bg-amber-50 text-amber-600"
          >
            Scanner domain shift
          </ToggleButton>
          <button
            type="button"
            onClick={() => resetModel(model.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          {state.attackInjected && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              Adversarial site active — Multi-Krum quarantine engaged
            </span>
          )}
        </div>
      </div>

      {/* Security ledger */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Round Activity &amp; Security Audit</h3>
          </div>
          <span className="text-xs text-slate-500">SHA-256 provenance ledger</span>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Source</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Hash</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {state.ledger.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    No rounds yet. Click <span className="font-medium text-slate-600">Train 10 rounds</span> to start
                    contributing.
                  </td>
                </tr>
              )}
              {state.ledger.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3 text-slate-700">{e.event}</td>
                  <td className="hidden px-5 py-3 text-slate-500 md:table-cell">{e.source}</td>
                  <td className="hidden px-5 py-3 lg:table-cell">
                    <span className="font-mono text-xs text-slate-400">{e.hash.slice(0, 16)}…</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{formatTime(e.timestamp)}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[e.status]}`}
                    >
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
