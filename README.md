# 🏔️ LANDSIGHT AI — Landslide Early Warning & Risk Monitoring System (NER India)

> 🛰️ **An independent build.** Conceived, engineered, and shipped by me, on my own initiative: every layer from the DEM contours to the dispatch console was designed with a single goal — helping the hills talk before they move.  
> **Coverage:** the 8 North Eastern States (Sikkim, Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura)

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

---

## 🌐 Run It From Anywhere — Hosted Deployment

The frontend (Next.js) and backend (FastAPI) are two separate services, so the live site is two hosts. `render.yaml` and `vercel.json` at the repo root are already wired for this.

### Render — FastAPI backend (free)

1. Render dashboard → **New → Blueprint** → connect this GitHub repo.
2. When prompted for `LANDSIGHT_AUTH_SECRET`, paste the shared secret from below (must match Vercel).
3. Deploy. Your backend lives at `https://landsight-backend.onrender.com` (defined in `render.yaml`).

### Vercel — Next.js frontend (free)

1. [vercel.com/new](https://vercel.com/new) → import this repo.
2. Framework: **Next.js** (auto-detected). Root Directory: **`frontend`** (already set via `vercel.json`).
3. Add two Environment Variables:
   - `BACKEND_URL` → `https://landsight-backend.onrender.com`
   - `LANDSIGHT_AUTH_SECRET` → the shared secret from below
4. **Deploy**, then open the `*.vercel.app` URL from any device.

### The shared secret

Session cookies are HMAC-SHA256 signed under `LANDSIGHT_AUTH_SECRET` — **both services must use the exact same value**. Generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set it on Render *and* Vercel. (The dev default `landsight-dev-2026` works but is not safe for a public site.)

### Demo accounts

- **Field Officer:** `OFF-SKM-001` · district `Mangan` (Sikkim) · access code `SKM482`
- **Citizen:** any full name + home state

### Honest notes

- Free tiers **sleep after ~15 min idle** — the first visit after a gap can take 30–60s to wake.
- The backend store is **in-memory**: restarts (or sleep cycles on free tier) reset the mock data. This is a prototype, not durable storage; a VPS/dedicated plan would fix both.
