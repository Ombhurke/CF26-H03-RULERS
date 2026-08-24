// Centralized, in-session marketplace store. Acts as the shared "coordinator"
// backend for the frontend: every model's global training state lives here, is
// updated as hospitals contribute rounds, and is observable by any component
// via useSyncExternalStore.

import {
  MODELS,
  type ContributingHospital,
  type ModelDefinition,
} from "./models-catalog";
import {
  cosineSimilarityFilter,
  multiKrumFilter,
  sha256Hex,
  type LedgerEvent,
} from "./fl-simulation";

export type SiteStatus = "idle" | "synced" | "harmonized" | "filtered";

export interface SiteState extends ContributingHospital {
  status: SiteStatus;
}

export interface ModelRuntimeState {
  id: string;
  round: number;
  maxRounds: number;
  accuracy: number;
  prevAccuracy: number;
  loss: number;
  epsilon: number;
  epsilonMax: number;
  mmd: number;
  attackInjected: boolean;
  domainShift: boolean;
  sites: SiteState[];
  accuracyHistory: number[];
  ledger: LedgerEvent[];
  isTraining: boolean;
  roundsRemaining: number;
}

const MAX_ROUNDS = 50;
const CONVERGENCE_K = 0.085;
const ROUND_INTERVAL_MS = 850;

// ---------------------------------------------------------------------------
// Store internals
// ---------------------------------------------------------------------------

type Store = Record<string, ModelRuntimeState>;

function seedModel(m: ModelDefinition): ModelRuntimeState {
  return {
    id: m.id,
    round: 0,
    maxRounds: MAX_ROUNDS,
    accuracy: m.baseAccuracy,
    prevAccuracy: m.baseAccuracy,
    loss: 0.9,
    epsilon: 0,
    epsilonMax: m.epsilonMax,
    mmd: 0.14,
    attackInjected: false,
    domainShift: false,
    sites: m.hospitals.map((h) => ({ ...h, status: "idle" as SiteStatus })),
    accuracyHistory: [m.baseAccuracy],
    ledger: [],
    isTraining: false,
    roundsRemaining: 0,
  };
}

function seed(): Store {
  const store: Store = {};
  for (const m of MODELS) store[m.id] = seedModel(m);
  return store;
}

let snapshot: Store = seed();
const serverSnapshot: Store = seed();
const listeners = new Set<() => void>();
const timers: Record<string, ReturnType<typeof setTimeout> | undefined> = {};

function emit() {
  // New top-level reference so useSyncExternalStore detects the change.
  snapshot = { ...snapshot };
  listeners.forEach((l) => l());
}

function setModel(id: string, next: ModelRuntimeState) {
  snapshot[id] = next;
  emit();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): Store {
  return snapshot;
}

export function getServerSnapshot(): Store {
  return serverSnapshot;
}

// ---------------------------------------------------------------------------
// Randomness helpers (client-only, used inside timers)
// ---------------------------------------------------------------------------

function randn(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function addNoise(vec: number[], s: number): number[] {
  return vec.map((x) => x + randn() * s);
}

function scaleVec(vec: number[], s: number): number[] {
  return vec.map((x) => x * s);
}

// ---------------------------------------------------------------------------
// One federated round for a single model, across its full hospital roster.
// ---------------------------------------------------------------------------

async function runRound(prev: ModelRuntimeState, def: ModelDefinition): Promise<ModelRuntimeState> {
  const round = prev.round + 1;
  const dim = 16;
  const now = Date.now();

  const base = Array.from({ length: dim }, () => randn());

  // Each site produces a synthetic weight-delta vector (never raw images).
  const updateMatrix = prev.sites.map((site) => {
    if (site.adversarial && prev.attackInjected) {
      // Label-flip attack inverts the gradient direction.
      return addNoise(scaleVec(base, -0.9), 0.6);
    }
    // Domain-shifted sites drift in magnitude until FedBN harmonizes them.
    const shift = prev.domainShift && site.code !== "GE";
    return addNoise(shift ? scaleVec(base, 0.85) : base, shift ? 0.32 : 0.16);
  });

  // Byzantine defense: Multi-Krum selection intersected with cosine consensus.
  const keep = Math.max(2, prev.sites.length - 1);
  const krum = new Set(multiKrumFilter(updateMatrix, keep));
  const cosineOk = cosineSimilarityFilter(updateMatrix);
  const acceptedIdx = prev.sites
    .map((_, i) => i)
    .filter((i) => krum.has(i) && cosineOk[i]);
  const rejectedIdx = prev.sites.map((_, i) => i).filter((i) => !acceptedIdx.includes(i));

  const sites: SiteState[] = prev.sites.map((s, i) => {
    if (rejectedIdx.includes(i)) return { ...s, status: "filtered" };
    if (prev.domainShift && s.code !== "GE") return { ...s, status: "harmonized" };
    return { ...s, status: "synced" };
  });

  // Convergence with diminishing returns; stays positive even while a poisoned
  // site is quarantined because the defense removed it from the aggregate.
  const converge =
    def.targetAccuracy - (def.targetAccuracy - def.baseAccuracy) * Math.exp(-CONVERGENCE_K * round);
  const jitter = randn() * 0.004;
  const accuracy = Math.min(def.targetAccuracy + 0.01, Math.max(prev.accuracy - 0.008, converge + jitter));
  const loss = Math.max(0.16, 0.9 * Math.exp(-CONVERGENCE_K * round) + 0.17 + randn() * 0.006);
  const epsilon = Math.min(prev.epsilonMax, prev.epsilon + prev.epsilonMax / 34);
  const mmd = prev.domainShift ? Math.max(0.09, 0.34 - round * 0.004) : Math.max(0.08, 0.14 - round * 0.002);

  const newEvents: LedgerEvent[] = [];

  for (const i of rejectedIdx) {
    const s = prev.sites[i];
    const hash = await sha256Hex(`reject:${def.id}:${round}:${s.id}:${now}`);
    newEvents.push({
      id: `${def.id}-${round}-${s.id}-blocked`,
      event: s.adversarial && prev.attackInjected ? "Poisoned update rejected (Multi-Krum)" : "Outlier update filtered",
      source: `${s.name} · ${s.code}`,
      timestamp: now,
      status: "Blocked",
      hash,
    });
  }

  if (prev.domainShift) {
    const hash = await sha256Hex(`harmonize:${def.id}:${round}:${now}`);
    newEvents.push({
      id: `${def.id}-${round}-harmonized`,
      event: "FedBN scanner harmonization applied",
      source: "Cross-site batch-norm",
      timestamp: now + 1,
      status: "Harmonized",
      hash,
    });
  }

  const summary = `model=${def.id}|round=${round}|acc=${accuracy.toFixed(4)}|sites=${acceptedIdx.length}`;
  const commitHash = await sha256Hex(summary);
  newEvents.push({
    id: `${def.id}-${round}-commit`,
    event: `Round ${round} checkpoint aggregated (${acceptedIdx.length} sites)`,
    source: "FL Coordinator",
    timestamp: now + 2,
    status: "Success",
    hash: commitHash,
  });

  return {
    ...prev,
    round,
    prevAccuracy: prev.accuracy,
    accuracy,
    loss,
    epsilon,
    mmd,
    sites,
    accuracyHistory: [...prev.accuracyHistory, accuracy].slice(-50),
    ledger: [...newEvents, ...prev.ledger].slice(0, 60),
  };
}

// ---------------------------------------------------------------------------
// Scheduler — drives queued rounds like a live telemetry stream.
// ---------------------------------------------------------------------------

function schedule(modelId: string) {
  if (timers[modelId]) return;
  const def = MODELS.find((m) => m.id === modelId);
  if (!def) return;

  const tick = async () => {
    const current = snapshot[modelId];
    if (!current || current.roundsRemaining <= 0 || current.round >= current.maxRounds) {
      timers[modelId] = undefined;
      setModel(modelId, { ...snapshot[modelId], isTraining: false, roundsRemaining: 0 });
      return;
    }
    const next = await runRound(current, def);
    setModel(modelId, {
      ...next,
      isTraining: true,
      roundsRemaining: current.roundsRemaining - 1,
    });
    timers[modelId] = setTimeout(tick, ROUND_INTERVAL_MS);
  };

  timers[modelId] = setTimeout(tick, ROUND_INTERVAL_MS);
}

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

export function trainModel(modelId: string, rounds = 10) {
  const current = snapshot[modelId];
  if (!current) return;
  const remaining = Math.min(current.maxRounds - current.round, current.roundsRemaining + rounds);
  setModel(modelId, { ...current, roundsRemaining: remaining, isTraining: remaining > 0 });
  schedule(modelId);
}

export function toggleAttack(modelId: string) {
  const current = snapshot[modelId];
  if (!current) return;
  setModel(modelId, { ...current, attackInjected: !current.attackInjected });
}

export function toggleDomainShift(modelId: string) {
  const current = snapshot[modelId];
  if (!current) return;
  setModel(modelId, { ...current, domainShift: !current.domainShift });
}

export function resetModel(modelId: string) {
  const def = MODELS.find((m) => m.id === modelId);
  if (!def) return;
  if (timers[modelId]) {
    clearTimeout(timers[modelId]);
    timers[modelId] = undefined;
  }
  setModel(modelId, seedModel(def));
}
