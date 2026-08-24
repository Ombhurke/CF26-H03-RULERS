import React, { useRef, useState } from "react";
import {
  Play,
  Loader2,
  ZapOff,
  Sliders,
  RotateCcw,
  ShieldCheck,
  GraduationCap,
  UploadCloud,
  FileCheck2,
  X,
  Lock,
} from "lucide-react";
import type { ModelDefinition } from "@/lib/models-catalog";
import type { ModelRuntimeState } from "@/lib/marketplace-store";
import { trainModel, toggleAttack, toggleDomainShift, resetModel } from "@/hooks/useMarketplace";

const STATUS_STYLES: Record<string, string> = {
  Success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Harmonized: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Blocked: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ToggleButton({
  active,
  onClick,
  icon,
  children,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${
        active ? activeClass : "border-border/80 bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

export function TrainingPanel({
  model,
  state,
}: {
  model: ModelDefinition;
  state: ModelRuntimeState;
}) {
  const [dataset, setDataset] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const done = state.round >= state.maxRounds;
  const canTrain = Boolean(dataset) && !state.isTraining && !done;

  function handleDatasetChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setDataset(file);
  }

  // Cycle the highlighted step through the guided list as rounds progress.
  const stepCount = model.trainingSteps.length;
  const currentStep = state.round === 0 ? 0 : (state.round - 1) % stepCount;

  return (
    <div className="space-y-5">
      {/* Guided steps */}
      <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border/60 px-6 py-4 bg-muted/20">
          <GraduationCap className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-foreground">How to Train &amp; Contribute to This Model</h3>
        </div>
        <ol className="divide-y divide-border/40">
          {model.trainingSteps.map((step, i) => {
            const active = state.isTraining && i === currentStep;
            const complete = state.round > 0 && (i < currentStep || done);
            return (
              <li key={step.title} className="flex items-start gap-4 px-6 py-4">
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all font-mono ${
                    complete
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                      : active
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 animate-pulse"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    {step.title}
                    {active && (
                      <span className="h-2 w-2 animate-ping rounded-full bg-indigo-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Local dataset selector */}
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <UploadCloud className="h-5 w-5 text-indigo-500" />
              Stage Your Hospital Dataset Volume
            </div>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Select your local cohort file (e.g. <code className="text-indigo-600 dark:text-indigo-400 font-mono">labels.csv</code> or de-identified DICOM archive). Preprocessing and model updates will run strictly on your browser/node instance.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={handleDatasetChange}
            accept=".csv,.zip,.dcm,.dicom,.png,.jpg,.jpeg,.tif,.tiff"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-card px-5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-all shadow-sm"
          >
            <UploadCloud className="h-4 w-4" />
            Select Dataset File
          </button>
        </div>

        {dataset ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <FileCheck2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="truncate font-bold font-mono">{dataset.name}</span>
              <span className="shrink-0 text-[11px] opacity-75">
                ({(dataset.size / 1024 / 1024).toFixed(2)} MB · Ready for DP-SGD)
              </span>
            </div>
            <button
              type="button"
              aria-label="Remove selected dataset"
              onClick={() => {
                setDataset(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-500/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-indigo-500/30 bg-card/60 px-4 py-3 text-center text-xs text-muted-foreground">
            No local volume loaded yet. Select a dataset above to unlock the training controls.
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-bold text-foreground">Execute Collaborative Training Rounds</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Dispatches local DP-SGD weight delta updates across all {state.sites.length} hospitals.
            </div>
          </div>
          <button
            type="button"
            onClick={() => trainModel(model.id, 10)}
            disabled={!canTrain}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state.isTraining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {done
              ? "Training Complete"
              : state.isTraining
              ? `Training Round… (${state.roundsRemaining} remaining)`
              : dataset
              ? "Train 10 Rounds from Dataset"
              : "Select Dataset to Train"}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">
            Simulate Adversary / Shift:
          </span>
          <ToggleButton
            active={state.attackInjected}
            onClick={() => toggleAttack(model.id)}
            icon={<ZapOff className="h-3.5 w-3.5" />}
            activeClass="border-rose-500/40 bg-rose-500/15 text-rose-600 dark:text-rose-400"
          >
            Byzantine Attack (Label-Flip)
          </ToggleButton>
          <ToggleButton
            active={state.domainShift}
            onClick={() => toggleDomainShift(model.id)}
            icon={<Sliders className="h-3.5 w-3.5" />}
            activeClass="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400"
          >
            Scanner Domain Shift (Siemens)
          </ToggleButton>
          <button
            type="button"
            onClick={() => resetModel(model.id)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset State
          </button>

          {state.attackInjected && (
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Rogue Node Active · Multi-Krum Quarantine Engaged
            </span>
          )}
        </div>
      </div>

      {/* Security provenance ledger */}
      <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-foreground">Provenance &amp; Cryptographic Audit Ledger</h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" /> SHA-256 Checkpoint Verification
          </span>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm border-b border-border/60">
              <tr className="uppercase font-bold tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Event Description</th>
                <th className="hidden px-6 py-3 md:table-cell">Source Hospital / Node</th>
                <th className="hidden px-6 py-3 lg:table-cell">Provenance Hash (SHA-256)</th>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3 text-right">Defense Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {state.ledger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">
                    No rounds recorded yet. Load a dataset and click <strong className="text-foreground">Train 10 Rounds</strong> to begin federated aggregation.
                  </td>
                </tr>
              ) : (
                state.ledger.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-foreground">{e.event}</td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground md:table-cell">{e.source}</td>
                    <td className="hidden px-6 py-3.5 lg:table-cell">
                      <span className="font-mono text-[11px] text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {e.hash.slice(0, 16)}…
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-muted-foreground">{formatTime(e.timestamp)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${STATUS_STYLES[e.status] || "bg-muted text-muted-foreground"}`}
                      >
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TrainingPanel;
