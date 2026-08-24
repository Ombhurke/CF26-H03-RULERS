"""
Federated Learning (FL) & Clinical Intelligence API Router
Handles PyTorch CNN training jobs with real multipart dataset uploads,
strict pre-flight format validation (rejecting non-image/tabular formats for CNNs),
live SSE progress & log streaming, benchmark verification gate checks, and traces history.
"""

import os
import uuid
import json
import asyncio
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from ml_fl_cnn import train_fl_model_job, DatasetValidationError
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


async def _execute_and_stream_job(
    job_id: str,
    model_id: str,
    hospital_id: str,
    hospital_name: str,
    dataset_name: str,
    file_bytes: Optional[bytes],
    modality: str,
    expected_classes: List[str],
    epochs: int,
    batch_size: int,
    baseline_accuracy: float,
    is_adversarial: bool
):
    queue = JOB_QUEUES.get(job_id)
    
    async def progress_callback(update: Dict[str, Any]):
        if queue:
            await queue.put({"type": "progress", "data": update})
            
    async def log_callback(log_line: str):
        if queue:
            await queue.put({"type": "log", "data": {"message": log_line}})

    try:
        if queue:
            await queue.put({
                "type": "phase",
                "data": {
                    "phase": "PRE_FLIGHT_VALIDATION",
                    "message": f"Inspecting dataset '{dataset_name}' for model '{model_id}'..."
                }
            })
            
        result = await train_fl_model_job(
            model_id=model_id,
            hospital_id=hospital_id,
            hospital_name=hospital_name or "Hospital Node",
            dataset_name=dataset_name or "dataset.zip",
            file_bytes=file_bytes,
            modality=modality,
            expected_classes=expected_classes,
            epochs=epochs or 10,
            batch_size=batch_size or 16,
            baseline_accuracy=baseline_accuracy or 0.76,
            is_adversarial=is_adversarial or False,
            progress_callback=progress_callback,
            log_callback=log_callback
        )
        
        result["job_id"] = job_id
        JOB_RESULTS[job_id] = result
        
        # Cache to hospital history
        h_list = HOSPITAL_HISTORY_CACHE.setdefault(hospital_id, [])
        h_list.insert(0, result)
        
        # Persist execution trace to Supabase if client is available
        if supabase:
            try:
                supabase.table("fl_training_jobs").insert({
                    "id": job_id,
                    "model_id": model_id,
                    "hospital_id": hospital_id,
                    "hospital_name": hospital_name or "Hospital Node",
                    "dataset_name": dataset_name,
                    "sample_count": result.get("sample_count", 0),
                    "epochs": epochs or 10,
                    "batch_size": batch_size or 16,
                    "baseline_accuracy": baseline_accuracy or 0.76,
                    "candidate_accuracy": result.get("candidate_accuracy"),
                    "candidate_f1": result.get("candidate_f1"),
                    "candidate_precision": result.get("candidate_precision"),
                    "candidate_recall": result.get("candidate_recall"),
                    "candidate_loss": result.get("candidate_loss"),
                    "gate_decision": result.get("gate_decision"),
                    "gate_reason": result.get("gate_reason"),
                    "duration_seconds": result.get("duration_seconds"),
                    "epoch_metrics": result.get("epoch_metrics", []),
                    "provenance_hash": result.get("provenance_hash")
                }).execute()
                
                # If accepted, update model table current accuracy
                if result.get("gate_decision") == "ACCEPTED":
                    supabase.table("fl_models").update({
                        "current_accuracy": result["candidate_accuracy"],
                        "current_loss": result["candidate_loss"]
                    }).eq("id", model_id).execute()
            except Exception as db_err:
                logger.warning("supabase_fl_job_persist_warning", context={"error": str(db_err)})
                
        if queue:
            await queue.put({"type": "complete", "data": result})
            await queue.put(None)  # Sentinel to close stream
            
    except DatasetValidationError as val_err:
        logger.warning("dataset_validation_failed", context={"job_id": job_id, "error": str(val_err)})
        failed_payload = {
            "job_id": job_id,
            "model_id": model_id,
            "hospital_id": hospital_id,
            "hospital_name": hospital_name,
            "dataset_name": dataset_name,
            "sample_count": 0,
            "epochs": epochs,
            "baseline_accuracy": baseline_accuracy,
            "candidate_accuracy": 0.0,
            "candidate_f1": 0.0,
            "candidate_precision": 0.0,
            "candidate_recall": 0.0,
            "candidate_loss": 0.0,
            "gate_decision": "FAILED",
            "gate_reason": f"Dataset Validation Failure: {str(val_err)}",
            "duration_seconds": 0.5,
            "epoch_metrics": [],
            "provenance_hash": "VALIDATION_FAILED"
        }
        JOB_RESULTS[job_id] = failed_payload
        h_list = HOSPITAL_HISTORY_CACHE.setdefault(hospital_id, [])
        h_list.insert(0, failed_payload)
        
        if queue:
            await queue.put({"type": "validation_error", "data": failed_payload})
            await queue.put(None)

    except Exception as err:
        logger.error("fl_training_job_error", context={"job_id": job_id, "error": str(err)})
        if queue:
            await queue.put({"type": "error", "data": {"error": str(err)}})
            await queue.put(None)


@router.post("/train-job")
async def start_training_job(
    model_id: str = Form(...),
    hospital_id: str = Form(...),
    hospital_name: Optional[str] = Form("Hospital Node"),
    modality: Optional[str] = Form("Chest X-ray"),
    classes_json: Optional[str] = Form('["Normal", "Pneumonia / Infiltration"]'),
    epochs: Optional[int] = Form(10),
    batch_size: Optional[int] = Form(16),
    baseline_accuracy: Optional[float] = Form(0.76),
    is_adversarial: Optional[bool] = Form(False),
    file: Optional[UploadFile] = File(None)
):
    """
    Spawns an asynchronous PyTorch CNN training job with actual uploaded file validation.
    Returns a unique job_id that can be streamed via SSE at /fl/train-stream/{job_id}.
    """
    job_id = str(uuid.uuid4())
    JOB_QUEUES[job_id] = asyncio.Queue()
    
    file_bytes = None
    dataset_name = "dataset.zip"
    
    if file:
        dataset_name = file.filename
        file_bytes = await file.read()
        
    try:
        expected_classes = json.loads(classes_json) if classes_json else ["Normal", "Pneumonia / Infiltration"]
    except Exception:
        expected_classes = ["Normal", "Pneumonia / Infiltration"]
    
    # Run training in background task
    asyncio.create_task(_execute_and_stream_job(
        job_id=job_id,
        model_id=model_id,
        hospital_id=hospital_id,
        hospital_name=hospital_name or "Hospital Node",
        dataset_name=dataset_name,
        file_bytes=file_bytes,
        modality=modality or "Chest X-ray",
        expected_classes=expected_classes,
        epochs=epochs or 10,
        batch_size=batch_size or 16,
        baseline_accuracy=baseline_accuracy or 0.76,
        is_adversarial=is_adversarial or False
    ))
    
    logger.info("fl_job_spawned", context={"job_id": job_id, "model_id": model_id, "dataset": dataset_name})
    
    return {
        "success": True,
        "job_id": job_id,
        "status": "VALIDATING_AND_TRAINING",
        "message": f"Training job initialized for {model_id} with file '{dataset_name}'."
    }


@router.get("/train-stream/{job_id}")
async def stream_training_progress(job_id: str):
    """
    Server-Sent Events (SSE) endpoint providing live epoch-by-epoch visual telemetry,
    real-time background log lines, and final validation scorecard.
    """
    queue = JOB_QUEUES.get(job_id)
    if not queue and job_id not in JOB_RESULTS:
        raise HTTPException(status_code=404, detail="Training job not found")
        
    async def event_generator():
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
    Retrieves history of all models trained by the authenticated hospital.
    """
    if supabase:
        try:
            res = supabase.table("fl_training_jobs").select("*").eq("hospital_id", hospital_id).order("created_at", desc=True).limit(50).execute()
            if res.data and len(res.data) > 0:
                return {"success": True, "history": res.data}
        except Exception as e:
            logger.warning("supabase_history_fetch_warning", context={"error": str(e)})
            
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
