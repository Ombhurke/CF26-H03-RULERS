import React, { useMemo, useState } from "react";
import { Search, Sparkles, Filter } from "lucide-react";
import { MODELS } from "@/lib/models-catalog";
import { ModelCard } from "./ModelCard";

const FILTERS = [
  "All",
  "Chest X-ray",
  "Dermatoscopy",
  "Breast Ultrasound",
  "Retinal Fundus",
  "Blood Microscopy",
  "Abdominal CT",
] as const;

export function ModelCatalog({ onOpen }: { onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const visible = useMemo(() => {
    return MODELS.filter((m) => {
      const matchesFilter = filter === "All" || m.modality === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q === "" ||
        m.name.toLowerCase().includes(q) ||
        m.modality.toLowerCase().includes(q) ||
        m.task.toLowerCase().includes(q) ||
        m.summary.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card relative overflow-hidden rounded-3xl border border-border/80 bg-white/90 dark:bg-card/90 p-6 md:p-8 backdrop-blur-xl shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Decentralized AI Marketplace (H-03)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground font-heading">
              Federated Medical AI Model Catalog
            </h1>
            <p className="mt-2 text-xs md:text-sm leading-relaxed text-muted-foreground">
              Participate in privacy-preserving collaborative model training. Supply local de-identified cohorts from your hospital&apos;s scanners to pool clinical intelligence without ever transferring raw patient radiographs or DICOM slices.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-card/80 border border-border/80 text-center min-w-[100px] shadow-sm">
              <div className="text-xl font-black text-foreground font-mono">{MODELS.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Models</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-card/80 border border-border/80 text-center min-w-[100px] shadow-sm">
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">0</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Images Shared</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by model, modality, or disease…"
            className="h-11 w-full rounded-2xl border border-border/80 bg-card/80 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1 hidden sm:inline-flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-indigo-600/25"
                  : "border border-border/80 bg-card/80 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Models Grid */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
          <Search className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-bold text-foreground">No Models Found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm">
            No federated models match "{query}". Try adjusting your search query or modality filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <ModelCard key={m.id} model={m} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ModelCatalog;
