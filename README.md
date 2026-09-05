# 🏔️ LANDSIGHT AI — Landslide Early Warning & Risk Monitoring System (NER India)

> **Smart India Hackathon (SIH 2026)**  
> **Problem Statement ID:** `SIH26001`  
> **Theme:** Disaster Management  
> **Team:** Storm Chasers  
> **Coverage:** 8 North Eastern States (Sikkim, Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura)

---

## 🌟 Key Capabilities & Modules

1. **Live Interactive Leaflet GIS Map**:
   - High-contrast dark GIS interface with multi-tier risk polygon overlays:
     - 🟢 **Low Risk (0–24)**
     - 🟡 **Moderate Risk (25–49)**
     - 🟠 **High Risk (50–74)**
     - 🔴 **Critical Risk (75–100 with pulsing animated radar pings)**
   - Verified citizen field incident markers with photo evidence and AI Vision confidence scores.
   - Strategic arterial corridors (NH-10, NH-29, NH-310A, Lumding-Badarpur railway section).

2. **AI Risk Predictor & XGBoost Heuristic Sandbox (`/predictor`)**:
   - Interactive sliders for:
     - 💧 24-Hour Rainfall Intensity (mm)
     - ⛰️ Terrain Slope Gradient (DEM °)
     - 🌊 Soil Moisture / Pore Water Saturation (%)
     - 🏔️ Orographic Elevation (m MSL)
     - 🪨 Geological Instability Score (1–10)
     - 📚 Historical Landslide Recurrence
   - **Explainable AI (XAI)**: SHAP-style factor contribution breakdown.
   - Automated Standard Operating Procedures (SOP) generation for District Emergency Operation Centers (DEOC) & SDRF.

3. **Offline-First Citizen & Field Reporting (`/report`)**:
   - Built on IndexedDB with automatic fallback to LocalStorage.
   - GPS Auto-Detection and manual pin coordinate refinement.
   - Photo upload with simulated **Computer Vision Damage Assessment**.
   - Multilingual Voice Note memo recording.
   - Background sync worker and auto-sync on network reconnect.

4. **Authority Emergency Response & Multilingual Dispatch (`/dispatch`)**:
   - Ranked emergency priority queue (Urgency × Population at risk).
   - Instant multilingual warning broadcast in **8 indigenous languages**:
     - English
     - Hindi (हिंदी)
     - Assamese (অসমীয়া)
     - Bengali (বাংলা)
     - Nepali (नेपाली)
     - Khasi (Ka Ktien Khasi)
     - Mizo (Mizo ṭawng)
     - Manipuri (Meiteilon)
   - Multi-channel delivery: SMS Cell Broadcast, CAP Siren, SDRF Tactical Radio, IVR Voice Call.
   - SDRF / NDRF battalion mobilization tracking.

5. **Hydro-Meteorological Telemetry & Analytics (`/analytics`)**:
   - Recharts 24h & 72h precipitation surge curves.
   - Subsurface MEMS inclinometer displacement vs pore-water pressure.
   - District Vulnerability Leaderboard.

6. **Research & Government Foundations (`/research`)**:
   - Direct integration citations for ISRO Landslide Atlas of India, Bhuvan Disaster Services, Geological Survey of India (Bhusanket), and IMD APIs.

---

## 🚀 Quickstart Guide

### 1. Launch Next.js Frontend & API (Recommended)
```bash
cd landsight-ai
npm run dev
```
Open **http://localhost:3000** in your browser.

### 2. (Optional) Run FastAPI ML Backend
```bash
cd landsight-ai
pip install -r backend/requirements.txt
python -m backend.main
```
FastAPI interactive docs will be live at **http://localhost:8000/docs**.

### 3. Run Backend Python Unit Tests
```bash
python -m backend.tests.test_risk_model
```
