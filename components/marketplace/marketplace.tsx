"use client"

import { useState } from "react"
import { Network } from "lucide-react"
import { getModel } from "@/lib/models-catalog"
import { ModelCatalog } from "./model-catalog"
import { ModelOverview } from "./model-overview"

export function Marketplace() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? getModel(selectedId) : undefined

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">MyHealthChain</div>
              <div className="text-xs text-slate-500">Federated Imaging Marketplace · Stelix</div>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">H-03</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {selected ? (
          <ModelOverview model={selected} onBack={() => setSelectedId(null)} />
        ) : (
          <ModelCatalog onOpen={setSelectedId} />
        )}
      </main>
    </div>
  )
}
