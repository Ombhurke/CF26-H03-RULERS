"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { MODELS } from "@/lib/models-catalog"
import { ModelCard } from "./model-card"

const FILTERS = ["All", "Chest X-ray", "Dermatoscopy", "Breast Ultrasound", "Retinal Fundus", "Blood Microscopy", "Abdominal CT"] as const

export function ModelCatalog({ onOpen }: { onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All")

  const visible = useMemo(() => {
    return MODELS.filter((m) => {
      const matchesFilter = filter === "All" || m.modality === filter
      const q = query.trim().toLowerCase()
      const matchesQuery =
        q === "" ||
        m.name.toLowerCase().includes(q) ||
        m.modality.toLowerCase().includes(q) ||
        m.task.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [query, filter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 text-balance">
          Federated Model Marketplace
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 text-pretty">
          Browse collaboratively trained medical imaging models. Contribute your hospital&apos;s labeled data to any
          model that matches the modality you hold — your images never leave your site, only privacy-protected weight
          updates are shared.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search models or modality…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
          No models match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <ModelCard key={m.id} model={m} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}
