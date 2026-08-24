# 🏥 MyHealthChain
### *Autonomous Emergency Triage & Real-Time Hospital Command Infrastructure*

[![Python Version](https://img.shields.io/badge/python-3.10%20%7C%203.11%20%7C%203.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0.0-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.0-61DAFB.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/tests-passing-brightgreen.svg)]()

> **"Zero-Delay Triage. Intelligent Resource Optimization. Saving Lives in Real Time."**

---

![MyHealthChain Official Banner](./cover.png)

---

## 📌 Executive Summary

**MyHealthChain** (Stelix) is an enterprise-grade, mission-critical emergency healthcare infrastructure platform. It automates emergency room patient triage, predicts hospital capacity overload, and orchestrates critical medical resources across regional health networks in real time.

By unifying **4 role-specific portals** (Patient, Doctor, Pharmacist, and Hospital Command Center) with **XGBoost ML triage engines**, **4-Signal time-series capacity forecasting**, **multimodal Gemini strategic AI**, and **decentralized IPFS record storage**, MyHealthChain eliminates critical bottlenecks in emergency medical response.

---

## ⚡ Key Performance Indicators & Architecture Highlights

| Metric / Layer | Specification | Details |
| :--- | :--- | :--- |
| ⚡ **Triage Inference Speed** | **< 5 ms** | XGBoost ESI model predicts priority instantly |
| 📈 **Surge Prediction Horizon** | **+1h & +4h** | 4-Signal algorithm forecasts incoming patient influx |
| 🛡️ **Offline Resilience** | **100% Fallback Coverage** | Operates cleanly even without external API keys |
| 🔒 **Security & Privacy** | **IPFS + PIN Lock** | Decentralized encrypted records with time-bound consent |
| 🌐 **Omnichannel Access** | **Web, WhatsApp, Voice** | Real-time WebSockets, Baileys API, Twilio & ElevenLabs |

---

## ⚠️ The Problem

1. **Emergency Overcrowding & Triage Delays:** Traditional ER triage relies on manual human assessment, causing dangerous wait times for critical patients during high-volume surges.
2. **Fragmented Hospital Resource Visibility:** Hospital administrators lack real-time predictive visibility into bed occupancy, ventilator stocks, oxygen supplies, and medical staff loads.
3. **Siloed Patient Records & Delayed Access:** Emergency clinicians often lack immediate access to patient medical histories during critical bedside or ambulance intake.
4. **Uncoordinated Pharmacy Fulfillment:** Prescriptions written in emergency settings frequently face stock-outs or fulfillment delays due to manual inventory systems.

---

## 💡 The Solution

MyHealthChain resolves these challenges through a unified multi-portal ecosystem:
- **Instant ML Triage (XGBoost):** Classifies incoming patient vitals into 5 Emergency Severity Index (ESI) tiers in under 5 milliseconds.
- **Predictive Command Center:** 4-Signal time-series forecasting engine predicts +1h and +4h patient surge volumes to reallocate beds and staffing proactively.
- **Decentralized Record Access (IPFS + QR):** PIN-protected Smart Health Cards grant instant bedside access to encrypted patient medical records.
- **Integrated Pharmacy & Telephony:** Automated prescription routing, Stripe checkout integration, and WhatsApp/Voice AI assistants for patient follow-up.

---

## 🏛️ Multi-Layer System Architecture

```
                  ┌─────────────────────────────────────────┐
                  │          MyHealthChain Ecosystem         │
                  └────────────────────┬────────────────────┘
                                       │
      ┌────────────────┬───────────────┴───────────────┬────────────────┐
      │                │                               │                │
┌─────▼──────┐  ┌──────▼──────┐                 ┌──────▼──────┐  ┌──────▼──────┐
│ 1. Patient │  │  2. Doctor  │                 │3. Pharmacist│  │ 4. Hospital │
│   Portal   │  │   Portal    │                 │   Portal    │  │Command Center│
└─────┬──────┘  └──────┬──────┘                 └──────┬──────┘  └──────┬──────┘
      │                │                               │                │
      └────────────────┼───────────────────────────────┴────────────────┘
                       │
       ┌───────────────┼────────────────┐
┌──────▼──────┐ ┌──────▼──────┐  ┌──────▼──────┐
│  WhatsApp   │ │  Voice AI   │  │Smart Health │
│  Gateway    │ │ (Telephony) │  │ Card (QR)   │
└─────────────┘ └─────────────┘  └─────────────┘
```

---

## 🔄 End-to-End Operational Workflow

```
Patient Vitals / Symptoms
        ↓
XGBoost ML Classifier (ESI 1-5 Priority Prediction)
        ↓
Realtime Hospital Emergency Queue (Supabase WebSockets)
        ↓
Doctor Portal (Bedside Scan & Prescription Issue)
        ↓
Pharmacist Portal (Fulfillment & Stripe Checkout)
        ↓
Hospital Command Center (4-Signal Surge Forecasting & Gemini Strategy)
```

---

## 🌐 Comprehensive 4-Portal Ecosystem

### 1. 🩸 Patient Portal
- **Real-Time Vitals Tracking:** Live health parameters and risk status overview.
- **Gemini AI Document OCR Scanner:** Instant extraction of lab reports and prescription text.
- **My Medicines & Refills:** Direct medicine ordering and Stripe checkout link integration.
- **Decentralized Records (IPFS):** Encrypted medical history management pinned on Pinata IPFS.
- **Granular Consent Controls:** Grant or revoke doctor access with time-bound permissions.

### 2. 🥼 Doctor Portal
- **Emergency Priority Queue:** Auto-sorted by ESI urgency score (RED to BLUE).
- **Smart Health Card QR Scanner:** Instant bedside lookup verified by a 4-digit PIN.
- **IPFS Record Decryptor:** Review patient clinical history and diagnostic scans.
- **Digital Prescription Authoring:** Direct prescription generation and pharmacy routing.

### 3. 💊 Pharmacist Portal
- **Real-Time Order Fulfillment Queue:** Track incoming prescriptions and Stripe payment status.
- **Pharmacist AI Assistant:** Automated drug-drug interaction validation and dosage checking.
- **Stock Management:** Real-time medicine stock adjustment and refill alerts.

### 4. 🏥 Hospital Command Center & Resource Load Balancer
- **Live ESI Triage Monitor:** Real-time emergency queue (RED, ORANGE, YELLOW, GREEN, BLUE).
- **Bed Occupancy Matrix:** ICU, General Ward, ER Bays, and Trauma Beds.
- **Supply Tracker:** Ventilators, Oxygen Cylinders, PPE, and Blood Bank stocks.
- **4-Signal Surge Forecasting:** AI volume forecasting for +1h and +4h horizons.
- **Gemini Strategic Command Analyzer:** Operational bottleneck detection and transfer advice.

---

## 🧠 AI & Machine Learning Pipeline

1. **XGBoost ESI Classifier (`ml_triage.py`):** Maps systolic BP, diastolic BP, heart rate, SpO2, body temperature, age, and chief complaint to 5 ESI priority levels.
2. **Random Forest Risk Engine (`ml_engine.py`):** Combines RegEx document parsing with Random Forest classification for chronic risk assessment.
3. **4-Signal Inflow Forecasting (`resource_load.py`):** Combines historical rolling averages, bed pressure multipliers, IPFS vector scans, and seasonal weather adjustments.
4. **Gemini 2.0 Flash Strategic Analyzer (`ai_config.py`):** Generates executive command summaries and resource re-allocation strategies.

---

## 📋 Environment Variables Reference

| Variable | Description | Required? | Fallback Mode |
| :--- | :--- | :---: | :--- |
| `PORT` | FastAPI backend server port (default: 8000) | Optional | Uses 8000 |
| `SUPABASE_URL` | Supabase project URL | Optional | Operates with local in-memory fallback |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret key | Optional | Operates with local in-memory fallback |
| `GEMINI_API_KEY` | Google Gemini GenAI API key | Optional | Uses clinical decision-support fallback |
| `STRIPE_SECRET_KEY` | Stripe payment gateway secret key | Optional | Uses development checkout test mode |
| `PINATA_API_KEY` | Pinata IPFS API key | Optional | Uses local storage fallback |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for telephony | Optional | Skips voice outbound calls |

---

## ⚙️ Quick Start & Installation

### Option A: Automated One-Command Setup (Recommended)
```bash
# On Linux / macOS:
./setup.sh

# On Windows PowerShell:
.\setup.ps1
```

### Option B: Manual Setup
```bash
# 1. Setup Backend Virtual Environment & Dependencies
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. Setup Frontend Dependencies
cd ../frontend
npm install
```

---

## 🏃 Running the Application

```bash
# Launch Backend & Frontend Services:
./start.sh                    # Windows: .\start_all.ps1
```

* 🌐 **Frontend UI:** `http://localhost:5173`
* ⚡ **FastAPI Backend:** `http://localhost:8000`
* 📖 **Interactive API Docs (Swagger):** `http://localhost:8000/docs`
* 🩺 **System Diagnostics Endpoint:** `http://localhost:8000/health`

---

## 🧪 Automated Testing Suite

To run the complete backend test suite:

```bash
cd backend
pytest tests/ -v
```

Tests cover:
- ✅ XGBoost ESI prediction and physiological range validation
- ✅ 4-Signal forecasting algorithm and seasonal adjustments
- ✅ Resilience fallbacks when external APIs are unconfigured
- ✅ Health diagnostic probes and API contracts

---

## ⚖️ Clinical Safety & Governance Notice

> **IMPORTANT CLINICAL DISCLAIMER:**  
> All AI and Machine Learning outputs generated by MyHealthChain (including ESI triage ratings, risk scores, and command recommendations) are strictly designated as **Clinical Decision Support (CDS)**.  
> 
> - Every AI output carries an explicit label: `AI-Assisted Assessment — Requires Clinician Confirmation`.
> - Critical clinical decisions, ESI priority overrides, and prescription authoring remain strictly under authoritative clinician control.

---

## 📑 Complete Documentation Suite

- 📘 [Detailed Project Summary & Architecture Blueprint](file:///d:/hackathon/health%20care%20system/summary.md)
- 📊 [Baseline Audit Report](file:///d:/hackathon/health%20care%20system/docs/evaluation/BASELINE_AUDIT.md)
- 🏆 [Final Evaluation Audit Report](file:///d:/hackathon/health%20care%20system/docs/evaluation/FINAL_EVALUATION.md)
- 🎬 [Hackathon Evaluation & 5-Min Demo Guide](file:///d:/hackathon/health%20care%20system/docs/demo/HACKATHON_DEMO.md)
- 🏛️ [Architecture Decision Records (ADRs)](file:///d:/hackathon/health%20care%20system/docs/decisions/)

---
