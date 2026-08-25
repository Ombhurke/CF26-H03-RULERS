"""
Upload Pretrained Base Models to Pinata IPFS (80MB CheXNet + 364MB CMR-AI)
==========================================================================
Uploads the full base foundation models to Pinata IPFS with SHA-256 validation.
Skips CT-CLIP (1.7 GB) as requested.
"""

import os
import sys
import time
import json
import hashlib
from pathlib import Path
import requests
from dotenv import load_dotenv

# Load env variables
BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

PINATA_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"
PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs"

JWT = os.getenv("PINATA_JWT") or os.getenv("VITE_PINATA_JWT") or ""
if not JWT:
    print("ERROR: PINATA_JWT not found in backend/.env", flush=True)
    sys.exit(1)

HEADERS = {"Authorization": f"Bearer {JWT}"}

MODELS_TO_UPLOAD = [
    {
        "name": "CheXNet_DenseNet121_Base_Model",
        "modality": "Chest X-ray",
        "path": BACKEND_DIR / "ml" / "chexnet" / "models" / "m-25012018-123527.pth.tar",
        "model_id": "cxr-pneumo-cnn",
    },
    {
        "name": "CMR_AI_VideoSwinTransformer_Base_Model",
        "modality": "Cardiac MRI",
        "path": BACKEND_DIR / "ml" / "CMR-AI" / "checkpoints" / "swin_base_patch244_window877_kinetics600_22k.pth",
        "model_id": "cmr-ai-vst",
    },
]


def compute_sha256(filepath: Path) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(1024 * 1024):
            sha.update(chunk)
    return sha.hexdigest()


def upload_file_to_pinata(model_info: dict):
    filepath = model_info["path"]
    if not filepath.exists():
        print(f"ERROR: File not found at {filepath}", flush=True)
        return None

    size_mb = filepath.stat().st_size / (1024 * 1024)
    print(f"\n=======================================================", flush=True)
    print(f"Uploading: {model_info['name']} ({size_mb:.2f} MB)", flush=True)
    print(f"Path: {filepath}", flush=True)
    print(f"=======================================================", flush=True)

    print("Computing SHA-256 checksum...", flush=True)
    sha256_hash = compute_sha256(filepath)
    print(f"SHA-256: {sha256_hash}", flush=True)

    metadata = {
        "name": f"{model_info['name']}_{filepath.name}",
        "keyvalues": {
            "model_id": model_info["model_id"],
            "modality": model_info["modality"],
            "type": "base_foundation_model",
            "sha256": sha256_hash,
            "size_mb": f"{size_mb:.2f}",
            "uploaded_at": str(time.time()),
        }
    }

    print(f"Sending multipart upload to Pinata IPFS (this may take 1-3 minutes for large models)...", flush=True)
    start_t = time.time()

    with open(filepath, "rb") as fp:
        files = {
            "file": (filepath.name, fp, "application/octet-stream"),
        }
        data = {
            "pinataMetadata": json.dumps(metadata),
            "pinataOptions": json.dumps({"cidVersion": 1}),
        }
        res = requests.post(
            PINATA_FILE_URL,
            headers=HEADERS,
            files=files,
            data=data,
            timeout=600,
        )

    duration = time.time() - start_t
    if res.status_code == 200:
        resp_json = res.json()
        cid = resp_json.get("IpfsHash")
        print(f"\n[SUCCESS] Uploaded in {duration:.1f}s!", flush=True)
        print(f"Pinata IPFS CID: {cid}", flush=True)
        print(f"Gateway URL: {PINATA_GATEWAY}/{cid}", flush=True)
        return {
            "name": model_info["name"],
            "model_id": model_info["model_id"],
            "cid": cid,
            "gateway_url": f"{PINATA_GATEWAY}/{cid}",
            "sha256": sha256_hash,
            "size_mb": size_mb,
        }
    else:
        print(f"\n[FAILED] Pinata upload error: {res.status_code} - {res.text}", flush=True)
        return None


def main():
    print("Starting Pinata Base Models Upload (CheXNet 80MB + CMR-AI 364MB)...", flush=True)
    results = []
    for m in MODELS_TO_UPLOAD:
        res = upload_file_to_pinata(m)
        if res:
            results.append(res)

    print("\n=======================================================", flush=True)
    print("UPLOAD SUMMARY:", flush=True)
    print("=======================================================", flush=True)
    for r in results:
        print(f"• {r['name']} ({r['size_mb']:.2f} MB):")
        print(f"  - CID: {r['cid']}")
        print(f"  - Gateway: {r['gateway_url']}")
        print(f"  - SHA-256: {r['sha256']}")

    # Save summary artifact JSON
    out_file = BACKEND_DIR / "services" / "base_models_ipfs.json"
    with open(out_file, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved IPFS mapping to {out_file}", flush=True)


if __name__ == "__main__":
    main()
