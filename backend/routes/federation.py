"""
Federated Learning (FL) & Clinical Intelligence API Router
Handles PyTorch CNN training jobs, real-time SSE progress streaming with ETA,
benchmark verification gate checks, and hospital execution traces history.
"""

import os
import uuid
import json
import asyncio
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from ml_fl_cnn import train_fl_model_job
from core.logger import logger

try:
    from supabase import create_client, Client
    SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    supabase: Optional[Client] = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
except Exception as e:
    supabase = None

router = APIRouter(prefix="/fl", tags=["Federated Clinical Intelligence"])

# In-memory queues for active streaming sessions and job caching
JOB_QUEUES: Dict[str, asyncio.Queue] = {}
JOB_RESULTS: Dict[str, Dict[str, Any]] = {}
HOSPITAL_HISTORY_CACHE: Dict[str, List[Dict[str, Any]]] = {}


class StartTrainingJobRequest(BaseModel):
    model_id: str = Field(..., description="ID of the federated clinical model")
    hospital_id: str = Field(..., description="UUID of the hospital node")
    hospital_name: Optional[str] = Field(default="Hospital Node")
    dataset_name: Optional[str] = Field(default="local_cohort.csv")
    sample_count: Optional[int] = Field(default=300, ge=10, le=50000)
    epochs: Optional[int] = Field(default=10, ge=1, le=50)
    batch_size: Optional[int] = Field(default=16, ge=4, le=128)
    baseline_accuracy: Optional[float] = Field(default=0.78)
    is_adversarial: Optional[bool] = Field(default=False)


class PublishModelRequest(BaseModel):
    id: str
    name: str
    short_name: str
    modality: str
    task: str
    summary: str
    description: str
    architecture: str
    parameters_count: str
    classes: List[str]
    target_accuracy: float = 0.95
    base_accuracy: float = 0.70
    min_samples: int = 100
    epsilon_max: float = 5.0


async def _execute_and_stream_job(job_id: str, req: StartTrainingJobRequest):
    queue = JOB_QUEUES.get(job_id)
    
    async def progress_callback(update: Dict[str, Any]):
        if queue:
            await queue.put({"type": "progress", "data": update})
            
    try:
        if queue:
            await queue.put({
                "type": "phase",
                "data": {
                    "phase": "INITIALIZING",
                    "message": f"Staging {req.sample_count} local cohort tensors for {req.hospital_name}..."
                }
            })
            
        result = await train_fl_model_job(
            model_id=req.model_id,
            hospital_id=req.hospital_id,
            hospital_name=req.hospital_name or "Hospital Node",
            dataset_name=req.dataset_name or "local_cohort.csv",
            sample_count=req.sample_count or 300,
            epochs=req.epochs or 10,
            batch_size=req.batch_size or 16,
            baseline_accuracy=req.baseline_accuracy or 0.78,
            is_adversarial=req.is_adversarial or False,
            progress_callback=progress_callback
        )
        
        result["job_id"] = job_id
        JOB_RESULTS[job_id] = result
        
        # Cache to hospital history
        h_list = HOSPITAL_HISTORY_CACHE.setdefault(req.hospital_id, [])
        h_list.insert(0, result)
        
        # Persist execution trace to Supabase if client is available
        if supabase:
            try:
                supabase.table("fl_training_jobs").insert({
                    "id": job_id,
                    "model_id": req.model_id,
                    "hospital_id": req.hospital_id,
                    "hospital_name": req.hospital_name or "Hospital Node",
                    "dataset_name": req.dataset_name or "local_cohort.csv",
                    "sample_count": req.sample_count or 300,
                    "epochs": req.epochs or 10,
                    "batch_size": req.batch_size or 16,
                    "baseline_accuracy": req.baseline_accuracy or 0.78,
                    "candidate_accuracy": result["candidate_accuracy"],
                    "candidate_f1": result["candidate_f1"],
                    "candidate_precision": result["candidate_precision"],
                    "candidate_recall": result["candidate_recall"],
                    "candidate_loss": result["candidate_loss"],
                    "gate_decision": result["gate_decision"],
                    "gate_reason": result["gate_reason"],
                    "duration_seconds": result["duration_seconds"],
                    "epoch_metrics": result["epoch_metrics"],
                    "provenance_hash": result["provenance_hash"]
                }).execute()
                
                # If accepted, update model table current accuracy
                if result["gate_decision"] == "ACCEPTED":
                    supabase.table("fl_models").update({
                        "current_accuracy": result["candidate_accuracy"],
                        "current_loss": result["candidate_loss"]
                    }).eq("id", req.model_id).execute()
            except Exception as db_err:
                logger.warning("supabase_fl_job_persist_warning", context={"error": str(db_err)})
                
        if queue:
            await queue.put({"type": "complete", "data": result})
            await queue.put(None)  # Sentinel to close stream
            
    except Exception as err:
        logger.error("fl_training_job_error", context={"job_id": job_id, "error": str(err)})
        if queue:
            await queue.put({"type": "error", "data": {"error": str(err)}})
            await queue.put(None)


@router.post("/train-job")
async def start_training_job(req: StartTrainingJobRequest, background_tasks: BackgroundTasks):
    """
    Spawns an asynchronous PyTorch CNN training job on the local hospital cohort.
    Returns a unique job_id that can be streamed via SSE at /fl/train-stream/{job_id}.
    """
    job_id = str(uuid.uuid4())
    JOB_QUEUES[job_id] = asyncio.Queue()
    
    # Run training in background task
    asyncio.create_task(_execute_and_stream_job(job_id, req))
    
    logger.info("fl_job_spawned", context={"job_id": job_id, "model_id": req.model_id, "hospital_id": req.hospital_id})
    
    return {
        "success": True,
        "job_id": job_id,
        "status": "TRAINING",
        "message": f"Training job initialized for {req.model_id}. Stream real-time progress via /fl/train-stream/{job_id}"
    }


@router.get("/train-stream/{job_id}")
async def stream_training_progress(job_id: str):
    """
    Server-Sent Events (SSE) endpoint providing live epoch-by-epoch visual telemetry,
    loss curves, current local accuracy, ETA countdown, and final benchmark verification scorecard.
    """
    queue = JOB_QUEUES.get(job_id)
    if not queue and job_id not in JOB_RESULTS:
        raise HTTPException(status_code=404, detail="Training job not found")
        
    async def event_generator():
        # If job already completed, yield complete state immediately
        if job_id in JOB_RESULTS:
            yield f"data: {json.dumps({'type': 'complete', 'data': JOB_RESULTS[job_id]})}\n\n"
            return

        while True:
            item = await queue.get()
            if item is None:
                break
            yield f"data: {json.dumps(item)}\n\n"
            
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/history/{hospital_id}")
async def get_hospital_training_history(hospital_id: str):
    """
    Retrieves history of all models trained by the authenticated hospital,
    including benchmark metrics (Accuracy, F1, Precision, Recall) and acceptance/rejection gate decisions.
    """
    if supabase:
        try:
            res = supabase.table("fl_training_jobs").select("*").eq("hospital_id", hospital_id).order("created_at", desc=True).limit(50).execute()
            if res.data and len(res.data) > 0:
                return {"success": True, "history": res.data}
        except Exception as e:
            logger.warning("supabase_history_fetch_warning", context={"error": str(e)})
            
    # Fallback to local memory cache
    history = HOSPITAL_HISTORY_CACHE.get(hospital_id, [])
    return {"success": True, "history": history}


@router.get("/traces/{job_id}")
async def get_training_job_traces(job_id: str):
    """
    Retrieves full execution traces, per-epoch telemetry, and cryptographic verification proof for a job.
    """
    if job_id in JOB_RESULTS:
        return {"success": True, "trace": JOB_RESULTS[job_id]}
        
    if supabase:
        try:
            res = supabase.table("fl_training_jobs").select("*").eq("id", job_id).maybe_single().execute()
            if res.data:
                return {"success": True, "trace": res.data}
        except Exception:
            pass
            
    raise HTTPException(status_code=404, detail="Trace record not found")


@router.post("/admin/publish-model")
async def admin_publish_model(req: PublishModelRequest):
    """
    Backend-only endpoint for machine learning engineers to register and deploy new federated models.
    """
    payload = {
        "id": req.id,
        "name": req.name,
        "short_name": req.short_name,
        "modality": req.modality,
        "task": req.task,
        "summary": req.summary,
        "description": req.description,
        "architecture": req.architecture,
        "parameters_count": req.parameters_count,
        "classes": req.classes,
        "target_accuracy": req.target_accuracy,
        "base_accuracy": req.base_accuracy,
        "current_accuracy": req.base_accuracy,
        "min_samples": req.min_samples,
        "epsilon_max": req.epsilon_max,
        "status": "recruiting"
    }
    
    if supabase:
        try:
            res = supabase.table("fl_models").upsert(payload).execute()
            return {"success": True, "model": res.data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    return {"success": True, "model": payload}
