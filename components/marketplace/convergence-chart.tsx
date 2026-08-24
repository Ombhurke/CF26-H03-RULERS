"use client"

import type { ModelRuntimeState } from "@/lib/marketplace-store"

export function ConvergenceChart({ state }: { state: ModelRuntimeState }) {
  const history = state.accuracyHistory
  const width = 520
  const height = 200
  const padX = 8
  const padY = 16

  const minV = 0.6
  const maxV = 1.0

  const points = history.map((v, i) => {
    const x = padX + (i / Math.max(history.length - 1, 1)) * (width - padX * 2)
    const y = padY + (1 - (v - minV) / (maxV - minV)) * (height - padY * 2)
    return [x, y] as const
  })

  const linePath = points
    .map((p, i) => {
      if (i === 0) return `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}`
      const prev = points[i - 1]
      const cx = (prev[0] + p[0]) / 2
      return `C ${cx.toFixed(1)} ${prev[1].toFixed(1)} ${cx.toFixed(1)} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`
    })
    .join(" ")

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1][0].toFixed(1)} ${height - padY} L ${points[0][0].toFixed(1)} ${height - padY} Z`
      : ""

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Convergence Trajectory</h3>
          <p className="mt-0.5 text-xs text-slate-500">Global validation accuracy per round</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Current Loss</div>
          <div className="font-mono text-lg font-semibold text-slate-900">{state.loss.toFixed(3)}</div>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 h-52 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Accuracy convergence curve"
      >
        <defs>
          <linearGradient id="convFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.65, 0.75, 0.85, 0.95].map((g) => {
          const y = padY + (1 - (g - minV) / (maxV - minV)) * (height - padY * 2)
          return (
            <g key={g}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={padX} y={y - 3} className="fill-slate-400 text-[9px]">
                {Math.round(g * 100)}%
              </text>
            </g>
          )
        })}
        {areaPath && <path d={areaPath} fill="url(#convFill)" />}
        <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1][0]}
            cy={points[points.length - 1][1]}
            r="4"
            fill="#4f46e5"
            stroke="#fff"
            strokeWidth="2"
          />
        )}
      </svg>
      <div className="mt-1 text-xs text-slate-500">
        Round <span className="font-semibold text-slate-700">{state.round}</span> of {state.maxRounds}
      </div>
    </div>
  )
}
