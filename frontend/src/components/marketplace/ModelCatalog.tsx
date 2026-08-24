import React, { useMemo, useState } from "react";
import { Search, Sparkles, Filter, Plus, X, Loader2, Database, ShieldCheck, CheckCircle } from "lucide-react";
import { useFLModels } from "@/hooks/useMarketplace";
import { initStore } from "@/lib/marketplace-store";
import { createFLModel } from "@/lib/fl-service";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { models, isLoading } = useFLModels();

  // Form state for creating new model
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    modality: "Chest X-ray",
    task: "",
    summary: "",
    description: "",
    architecture: "ResNet-18",
    parametersCount: "11.2M",
    classes: "Normal, Abnormal",
    targetAccuracy: 95,
    minSamples: 500,
    epsilonMax: 5.0,
  });

  const visible = useMemo(() => {
    return models.filter((m) => {
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
  }, [models, query, filter]);

  async function handleCreateModel(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setIsSubmitting(true);
    try {
      const classList = form.classes
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      await createFLModel({
        name: form.name.trim(),
        short_name: form.shortName.trim() || form.name.split(" ")[0],
        modality: form.modality,
        task: form.task.trim() || "Classification",
        summary: form.summary.trim() || form.name.trim(),
        description: form.description.trim() || form.summary.trim() || form.name.trim(),
        architecture: form.architecture,
        parameters_count: form.parametersCount,
        classes: classList.length > 0 ? classList : ["Normal", "Abnormal"],
        target_accuracy: form.targetAccuracy / 100,
        base_accuracy: 0.70,
        min_samples: Number(form.minSamples) || 100,
        epsilon_max: Number(form.epsilonMax) || 5.0,
      });

      // Reload store state from Supabase
      await initStore();
      setIsModalOpen(false);
      setForm({
        name: "",
        shortName: "",
        modality: "Chest X-ray",
        task: "",
        summary: "",
        description: "",
        architecture: "ResNet-18",
        parametersCount: "11.2M",
        classes: "Normal, Abnormal",
        targetAccuracy: 95,
        minSamples: 500,
        epsilonMax: 5.0,
      });
    } catch (err) {
      console.error("Failed to create model:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
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

      {/* Models Grid or Empty State */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-border/60 bg-card/40 p-6 animate-pulse space-y-4">
              <div className="h-6 w-24 rounded-full bg-muted" />
              <div className="h-6 w-3/4 rounded-lg bg-muted" />
              <div className="h-12 w-full rounded-lg bg-muted/60" />
              <div className="h-8 w-1/2 rounded-lg bg-muted" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/50 p-12 text-center">
          <Database className="h-10 w-10 text-indigo-500/50 mb-3" />
          <h3 className="text-base font-bold text-foreground">
            {models.length === 0 ? "No Federated Models Registered in Database" : "No Matching Models Found"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md">
            {models.length === 0
              ? "Your database fl_models table is currently empty. Click below to register your first collaborative clinical model."
              : `No models match "${query}". Try adjusting your search query or modality filter.`}
          </p>
          {models.length === 0 && (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Register First Model
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((m) => (
            <ModelCard key={m.id} model={m} onOpen={onOpen} />
          ))}
        </div>
      )}

      {/* Register Model Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Register Federated Model</h3>
                <p className="text-xs text-muted-foreground">Define clinical task and architecture for collaborative training</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateModel} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-foreground">Model Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Pediatric Pneumonia Detector"
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-muted/40 px-3 font-medium text-foreground focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground">Short Code / Name</label>
                  <input
                    type="text"
                    required
                    value={form.shortName}
                    onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                    placeholder="e.g. PneumoNet"
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-muted/40 px-3 font-medium text-foreground focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-foreground">Modality</label>
                  <select
                    value={form.modality}
                    onChange={(e) => setForm({ ...form, modality: e.target.value })}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-muted/40 px-3 font-medium text-foreground focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Chest X-ray">Chest X-ray</option>
                    <option value="Dermatoscopy">Dermatoscopy</option>
                    <option value="Breast Ultrasound">Breast Ultrasound</option>
                    <option value="Retinal Fundus">Retinal Fundus</option>
                    <option value="Blood Microscopy">Blood Microscopy</option>
                    <option value="Abdominal CT">Abdominal CT</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-foreground">Architecture</label>
                  <input
                    type="text"
                    required
                    value={form.architecture}
                    onChange={(e) => setForm({ ...form, architecture: e.target.value })}
                    placeholder="e.g. ResNet-18, EfficientNet-B0"
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-muted/40 px-3 font-medium text-foreground focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground">Clinical Task</label>
                <input
                  type="text"
                  required
                  value={form.task}
                  onChange={(e) => setForm({ ...form, task: e.target.value })}
                  placeholder="e.g. Binary classification · Normal vs. Pneumonia"
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-muted/40 px-3 font-medium text-foreground focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-foreground">Diagnostic Classes (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={form.classes}
                  onChange={(e) => setForm({ ...form, classes: e.target.value })}
                  placeholder="e.g. Normal, Bacterial Pneumonia, Viral Pneumonia"
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-muted/40 px-3 font-medium text-foreground focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-foreground">Summary</label>
                <textarea
                  rows={2}
                  required
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Brief clinical description of the model screening task..."
                  className="mt-1 w-full rounded-xl border border-border bg-muted/40 p-3 font-medium text-foreground focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-foreground">Target Acc (%)</label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={form.targetAccuracy}
                    onChange={(e) => setForm({ ...form, targetAccuracy: Number(e.target.value) })}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-muted/40 px-3 font-medium text-foreground focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground">Min Cohort</label>
                  <input
                    type="number"
                    min={10}
                    value={form.minSamples}
                    onChange={(e) => setForm({ ...form, minSamples: Number(e.target.value) })}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-muted/40 px-3 font-medium text-foreground focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground">ε Max Budget</label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    value={form.epsilonMax}
                    onChange={(e) => setForm({ ...form, epsilonMax: Number(e.target.value) })}
                    className="mt-1 h-10 w-full rounded-xl border border-border bg-muted/40 px-3 font-medium text-foreground focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-4 py-2.5 font-bold text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Register Model in DB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelCatalog;
