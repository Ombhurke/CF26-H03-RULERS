"use client"

import { ShieldCheck, Building2, TrendingUp, Waves } from "lucide-react"
import type { ModelRuntimeState } from "@/lib/marketplace-store"

function SemiGauge({ value }: { value: number }) {
  const radius = 46
  const cx = 60
  const cy = 60
  const circumference = Math.PI * radius
  const offset = circumference * (1 - Math.min(1, Math.max(0, value)))
  return (
    <svg viewBox="0 0 120 70" className="h-16 w-28" aria-hidden="true">
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none"
        stroke="#4f46e5"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  )
}

function ProgressRing({ fraction }: { fraction: number }) {
  const radius = 26
  const stroke = 7
  const c = 2 * Math.PI * radius
  const offset = c * (1 - Math.min(1, Math.max(0, fraction)))
  return (
    <svg viewBox="0 0 68 68" className="h-16 w-16" aria-hidden="true">
      <circle cx="34" cy="34" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx="34"
        cy="34"
        r={radius}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 34 34)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="34" y="38" textAnchor="middle" className="fill-slate-700 text-[13px] font-semibold">
        {Math.round(fraction * 100)}%
      </text>
    </svg>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">{children}</div>
}

export function MetricCards({ state }: { state: ModelRuntimeState }) {
  const delta = state.accuracy - state.prevAccuracy
  const synced = state.sites.filter((s) => s.status !== "filtered").length
  const filtered = state.sites.filter((s) => s.status === "filtered").length
  const epsilonFraction = state.epsilon / state.epsilonMax

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Global Accuracy</span>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${delta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
          >
            {delta >= 0 ? "+" : ""}
            {(delta * 100).toFixed(1)}% / round
          </span>
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div className="text-3xl font-semibold tracking-tight text-slate-900">{(state.accuracy * 100).toFixed(1)}%</div>
          <SemiGauge value={state.accuracy} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 text-slate-500">
          <Building2 className="h-4 w-4" />
          <span className="text-xs font-medium">Participating Sites</span>
        </div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{state.sites.length}</div>
        <div className="mt-1 text-xs text-slate-500">
          {synced} contributing, {filtered} filtered
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {state.sites.map((s) => (
            <span
              key={s.id}
              className={`inline-flex h-7 min-w-9 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold ${
                s.status === "filtered"
                  ? "bg-rose-100 text-rose-700"
                  : s.status === "harmonized"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-indigo-100 text-indigo-700"
              }`}
              title={s.name}
            >
              {s.code}
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 text-slate-500">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-xs font-medium">Privacy Budget</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="text-3xl font-semibold tracking-tight text-slate-900">ε = {state.epsilon.toFixed(2)}</div>
            <div className="mt-1 text-xs text-slate-500">DP-SGD / {state.epsilonMax.toFixed(1)} max</div>
          </div>
          <ProgressRing fraction={epsilonFraction} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 text-slate-500">
          <Waves className="h-4 w-4" />
          <span className="text-xs font-medium">Scanner Adaptation</span>
        </div>
        <div className="mt-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${state.mmd < 0.2 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}
          >
            <span className={`h-2 w-2 rounded-full ${state.mmd < 0.2 ? "bg-blue-500" : "bg-amber-500"}`} />
            {state.mmd < 0.2 ? "Harmonized" : "Adapting"}
          </span>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          {state.mmd.toFixed(2)} MMD — {state.mmd < 0.2 ? "low" : "elevated"} domain drift
        </div>
      </Card>
    </div>
  )
}
