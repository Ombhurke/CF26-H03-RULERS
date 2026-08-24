import { supabase } from "@/lib/supabase";
import { sha256Hex } from "@/lib/fl-simulation";

export interface FLModel {
  id: string;
  name: string;
  short_name: string;
  modality: string;
  task: string;
  summary: string;
  description: string;
  architecture: string;
  parameters_count: string;
  classes: string[];
  input_spec: {
    resolution: string;
    channels: string;
    format: string;
  };
  data_requirements: Array<{ label: string; value: string }>;
  preprocessing_steps: string[];
  training_steps: Array<{ title: string; detail: string }>;
  base_accuracy: number;
  target_accuracy: number;
  current_accuracy: number;
  current_round: number;
  max_rounds: number;
  epsilon_max: number;
  current_epsilon: number;
  current_loss: number;
  current_mmd: number;
  status: "recruiting" | "training" | "converged";
  min_samples: number;
  accent: string;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FLHospitalNode {
  id: string;
  model_id: string;
  hospital_id: string;
  hospital_name: string;
  hospital_code: string;
  region: string;
  scanner_model: string;
  local_samples_count: number;
  dataset_name?: string | null;
  dataset_size_mb?: number | null;
  node_status: "ready" | "synced" | "harmonized" | "quarantined" | "training" | "idle";
  is_adversarial: boolean;
  last_round_participated: number;
  local_loss?: number | null;
  local_accuracy?: number | null;
  joined_at?: string;
  updated_at?: string;
}

export interface FLTrainingRound {
  id: string;
  model_id: string;
  round_number: number;
  global_accuracy: number;
  global_loss: number;
  epsilon_spent: number;
  mmd_drift: number;
  participating_nodes_count: number;
  accepted_nodes_count: number;
  rejected_nodes_count: number;
  checkpoint_hash: string;
  aggregated_at: string;
}

export interface FLAuditEvent {
  id: string;
  model_id: string;
  hospital_id?: string | null;
  event_type: string;
  event_description: string;
  source_node: string;
  provenance_hash: string;
  status: "Success" | "Harmonized" | "Blocked" | "Warning";
  created_at: string;
}

/** Fetch all models directly from Supabase fl_models table. Returns empty array if none exist. */
export async function getFLModels(): Promise<FLModel[]> {
  try {
    const { data, error } = await supabase
      .from("fl_models")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data) {
      console.warn("No fl_models found in Supabase:", error?.message);
      return [];
    }

    return data as FLModel[];
  } catch (err) {
    console.error("Failed to load fl_models from Supabase:", err);
    return [];
  }
}

/** Fetch a single model by ID */
export async function getFLModelById(id: string): Promise<FLModel | undefined> {
  try {
    const { data, error } = await supabase
      .from("fl_models")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return undefined;
    return data as FLModel;
  } catch (err) {
    return undefined;
  }
}

/** Create and register a new model in Supabase */
export async function createFLModel(model: Partial<FLModel>): Promise<FLModel | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const modelId = model.id || (model.short_name || model.name || "model").toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const payload = {
      id: modelId,
      name: model.name || "Custom Clinical Model",
      short_name: model.short_name || "Net",
      modality: model.modality || "Chest X-ray",
      task: model.task || "Binary classification",
      summary: model.summary || "Clinical diagnostic model",
      description: model.description || "Collaborative federated model",
      architecture: model.architecture || "ResNet-18",
      parameters_count: model.parameters_count || "11.2M",
      classes: model.classes || ["Normal", "Abnormal"],
      input_spec: model.input_spec || { resolution: "224 × 224", channels: "1 (grayscale)", format: "DICOM or PNG" },
      data_requirements: model.data_requirements || [
        { label: "Modality", value: model.modality || "Clinical Imaging" },
        { label: "Min. studies", value: "100 per site" },
        { label: "PHI", value: "De-identified at source" },
      ],
      preprocessing_steps: model.preprocessing_steps || [
        "Local intensity normalization",
        "Spatial resampling",
      ],
      training_steps: model.training_steps || [
        { title: "Stage local dataset", detail: "Load de-identified studies in the local hospital volume." },
        { title: "Run DP-SGD training", detail: "Execute local epochs with differential privacy noise." },
        { title: "Submit weight delta", detail: "Transmit screened gradient weights to coordinator." },
      ],
      base_accuracy: model.base_accuracy ?? 0.70,
      target_accuracy: model.target_accuracy ?? 0.95,
      current_accuracy: model.base_accuracy ?? 0.70,
      current_round: 0,
      max_rounds: model.max_rounds ?? 50,
      epsilon_max: model.epsilon_max ?? 5.0,
      current_epsilon: 0.0,
      current_loss: 0.90,
      current_mmd: 0.14,
      status: "recruiting",
      min_samples: model.min_samples ?? 100,
      accent: model.accent || "indigo",
      created_by: userData.user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("fl_models")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as FLModel;
  } catch (err) {
    console.error("Failed to create FL model:", err);
    return null;
  }
}

/** Fetch participating hospital nodes for a model */
export async function getFLHospitalNodes(modelId: string): Promise<FLHospitalNode[]> {
  try {
    const { data, error } = await supabase
      .from("fl_hospital_nodes")
      .select("*")
      .eq("model_id", modelId)
      .order("joined_at", { ascending: true });

    if (error || !data) return [];
    return data as FLHospitalNode[];
  } catch (err) {
    console.error("Failed to fetch fl_hospital_nodes:", err);
    return [];
  }
}

/** Fetch the currently logged-in hospital's node record for a model */
export async function getMyHospitalNode(modelId: string): Promise<FLHospitalNode | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from("fl_hospital_nodes")
      .select("*")
      .eq("model_id", modelId)
      .eq("hospital_id", userData.user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data as FLHospitalNode;
  } catch (err) {
    return null;
  }
}

/** Register or update current hospital's local node and dataset stats */
export async function upsertMyHospitalNode(
  modelId: string,
  nodeDetails: {
    hospitalName?: string;
    hospitalCode?: string;
    scannerModel?: string;
    region?: string;
    localSamplesCount: number;
    datasetName?: string;
    datasetSizeMb?: number;
    nodeStatus?: "ready" | "synced" | "harmonized" | "quarantined" | "training" | "idle";
    isAdversarial?: boolean;
  }
): Promise<FLHospitalNode | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Hospital authentication required");

    let resolvedName = nodeDetails.hospitalName;
    if (!resolvedName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", userData.user.id)
        .maybeSingle();
      resolvedName = profile?.full_name || userData.user.email?.split("@")[0] || "Hospital Node";
    }

    const hospitalCode = nodeDetails.hospitalCode || (resolvedName || "HOS").slice(0, 3).toUpperCase();

    const payload = {
      model_id: modelId,
      hospital_id: userData.user.id,
      hospital_name: resolvedName || "Hospital Node",
      hospital_code: hospitalCode,
      region: nodeDetails.region || "Local Secure Perimeter",
      scanner_model: nodeDetails.scannerModel || "Standard DICOM Clinical Scanner",
      local_samples_count: nodeDetails.localSamplesCount,
      dataset_name: nodeDetails.datasetName || null,
      dataset_size_mb: nodeDetails.datasetSizeMb || null,
      node_status: nodeDetails.nodeStatus || "ready",
      is_adversarial: nodeDetails.isAdversarial ?? false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("fl_hospital_nodes")
      .upsert(payload, { onConflict: "model_id,hospital_id" })
      .select()
      .single();

    if (error) throw error;
    return data as FLHospitalNode;
  } catch (err) {
    console.error("Failed to upsert hospital node:", err);
    return null;
  }
}

/** Fetch historical training rounds for a model */
export async function getFLTrainingRounds(modelId: string): Promise<FLTrainingRound[]> {
  try {
    const { data, error } = await supabase
      .from("fl_training_rounds")
      .select("*")
      .eq("model_id", modelId)
      .order("round_number", { ascending: true });

    if (error || !data) return [];
    return data as FLTrainingRound[];
  } catch (err) {
    return [];
  }
}

/** Fetch cryptographic audit ledger events for a model */
export async function getFLAuditLedger(modelId: string): Promise<FLAuditEvent[]> {
  try {
    const { data, error } = await supabase
      .from("fl_audit_ledger")
      .select("*")
      .eq("model_id", modelId)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error || !data) return [];
    return data as FLAuditEvent[];
  } catch (err) {
    return [];
  }
}

/** Persist a completed training round and audit checkpoint to Supabase */
export async function recordTrainingRoundCommit(params: {
  modelId: string;
  roundNumber: number;
  accuracy: number;
  loss: number;
  epsilon: number;
  mmd: number;
  participatingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  auditEvents: Array<{
    eventType: string;
    description: string;
    sourceNode: string;
    hash: string;
    status: "Success" | "Harmonized" | "Blocked" | "Warning";
  }>;
}) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || null;

    const commitSummary = `model=${params.modelId}|round=${params.roundNumber}|acc=${params.accuracy.toFixed(4)}|loss=${params.loss.toFixed(4)}`;
    const checkpointHash = await sha256Hex(commitSummary);

    // 1. Insert training round
    await supabase.from("fl_training_rounds").upsert({
      model_id: params.modelId,
      round_number: params.roundNumber,
      global_accuracy: params.accuracy,
      global_loss: params.loss,
      epsilon_spent: params.epsilon,
      mmd_drift: params.mmd,
      participating_nodes_count: params.participatingCount,
      accepted_nodes_count: params.acceptedCount,
      rejected_nodes_count: params.rejectedCount,
      checkpoint_hash: checkpointHash,
      triggered_by: userId,
      aggregated_at: new Date().toISOString(),
    }, { onConflict: "model_id,round_number" });

    // 2. Update model table current stats
    await supabase.from("fl_models").update({
      current_round: params.roundNumber,
      current_accuracy: params.accuracy,
      current_loss: params.loss,
      current_epsilon: params.epsilon,
      current_mmd: params.mmd,
      status: params.roundNumber >= 50 ? "converged" : "training",
      updated_at: new Date().toISOString(),
    }).eq("id", params.modelId);

    // 3. Insert audit ledger events
    if (params.auditEvents.length > 0) {
      const ledgerRows = params.auditEvents.map((evt) => ({
        model_id: params.modelId,
        hospital_id: userId,
        event_type: evt.eventType,
        event_description: evt.description,
        source_node: evt.sourceNode,
        provenance_hash: evt.hash,
        status: evt.status,
        created_at: new Date().toISOString(),
      }));

      await supabase.from("fl_audit_ledger").insert(ledgerRows);
    }
  } catch (err) {
    console.error("Error committing FL training round to Supabase:", err);
  }
}
