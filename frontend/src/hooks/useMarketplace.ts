import { useSyncExternalStore } from "react";
import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  type ModelRuntimeState,
} from "@/lib/marketplace-store";

export {
  trainModel,
  toggleAttack,
  toggleDomainShift,
  resetModel,
} from "@/lib/marketplace-store";

/** Subscribe to the whole marketplace (all models). */
export function useMarketplace(): Record<string, ModelRuntimeState> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Subscribe to a single model's live runtime state. */
export function useModelState(modelId: string): ModelRuntimeState | undefined {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return store[modelId];
}
