import React, { useState } from "react";
import {
  ArrowLeft,
  Cpu,
  Building2,
  MapPin,
  LayoutGrid,
  Database,
  GraduationCap,
  AlertTriangle,
  Layers,
  Sparkles,
} from "lucide-react";
import type { ModelDefinition } from "@/lib/models-catalog";
import type { SiteState } from "@/lib/marketplace-store";
import { useModelState } from "@/hooks/useMarketplace";
import { MetricCards } from "./MetricCards";
import { ConvergenceChart } from "./ConvergenceChart";
import { DataRequirements } from "./DataRequirements";
import { TrainingPanel } from "./TrainingPanel";

type Section = "overview" | "data" | "train";

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Model Architecture & Overview", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "data", label: "Data Requirements & Eligibility", icon: <Database className="h-4 w-4" /> },
  { id: "train", label: "Train & Contribute Rounds", icon: <GraduationCap className="h-4 w-4" /> },
];

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono font-bold text-foreground">{value}</dd>
    </div>
  );
}

function HospitalsPanel({
  model,
  sites,
}: {
  model: ModelDefinition;
  sites: SiteState[];
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4 bg-muted/20">
        <Building2 className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-foreground">Contributing Hospital Roster</h3>
        <span className="ml-auto text-xs text-muted-foreground font-mono">
          {model.hospitals.length} active sites
        </span>
      </div>
      <ul className="divide-y divide-border/40">
        {sites.map((s) => (
          <li key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
            <span
              className={`inline-flex h-10 w-12 shrink-0 items-center justify-center rounded-xl text-xs font-bold font-mono border ${
                s.status === "filtered"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  : s.status === "harmonized"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : s.adversarial
                  ? "bg-muted text-muted-foreground border-border"
                  : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
              }`}
            >
              {s.code}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <span className="truncate">{s.name}</span>
                {s.adversarial && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="h-2.5 w-2.5" /> Rogue Node
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 text-indigo-500" />
                {s.region} · {s.scanner}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs font-bold text-foreground">
                {s.samples.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Studies</div>
            </div>
            <span
              className={`ml-2 hidden rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border sm:inline-flex ${
                s.status === "filtered"
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  : s.status === "harmonized"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : s.status === "synced"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {s.status === "idle" ? "Ready" : s.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ModelOverview({
  model,
  onBack,
}: {
  model: ModelDefinition;
  onBack: () => void;
}) {
  const state = useModelState(model.id);
  const [section, setSection] = useState<Section>("overview");

  if (!state) return null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Models Marketplace
        </button>
      </div>

      {/* Model Header */}
      <div className="flex flex-col gap-5 rounded-3xl border border-border/80 bg-gradient-to-br from-indigo-950/15 via-card to-card p-6 md:p-8 backdrop-blur-xl shadow-lg lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
            <Cpu className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground font-heading">
                {model.name}
              </h1>
              <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-0.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {model.shortName}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-xs md:text-sm leading-relaxed text-muted-foreground">
              {model.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                {model.modality}
              </span>
              <span>·</span>
              <span className="font-medium text-foreground">{model.task}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-border/60 pb-2 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
              section === s.id
                ? "bg-indigo-600 text-white shadow-indigo-600/25"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {section === "overview" && (
        <div className="space-y-6">
          <MetricCards state={state} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ConvergenceChart state={state} />
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-6 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Layers className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Architecture &amp; Bounds</span>
              </div>
              <dl className="divide-y divide-border/40">
                <SpecRow label="Neural Backbone" value={model.architecture} />
                <SpecRow label="Trainable Parameters" value={model.parameters} />
                <SpecRow label="Input Dimensions" value={model.input.resolution} />
                <SpecRow label="Output Classes" value={String(model.classes.length)} />
                <SpecRow label="Target AUC-ROC" value={`${(model.targetAccuracy * 100).toFixed(0)}%`} />
                <SpecRow label="Privacy Budget (ε)" value={`≤ ${model.epsilonMax.toFixed(1)}`} />
              </dl>
              <div className="mt-4 pt-3 border-t border-border/40">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Classification Labels:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {model.classes.map((c) => (
                    <span
                      key={c}
                      className="rounded-lg bg-muted/60 border border-border/60 px-2 py-1 text-[11px] font-medium text-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <HospitalsPanel model={model} sites={state.sites} />
        </div>
      )}

      {section === "data" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DataRequirements model={model} />
          </div>
          <HospitalsPanel model={model} sites={state.sites} />
        </div>
      )}

      {section === "train" && <TrainingPanel model={model} state={state} />}
    </div>
  );
}

export default ModelOverview;
