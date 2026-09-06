"""
LANDSIGHT AI - Backend Server Entrypoint
FastAPI server for the Early Warning & Landslide Risk Monitoring System for NER India
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import os
import uvicorn

from backend.api.routes import router

app = FastAPI(
    title="LANDSIGHT AI - Landslide Risk Inference & Warning Engine",
    description="Backend API for the LANDSIGHT AI early warning and landslide risk monitoring system for NER India",
    version="1.0.0"
)

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "landsight-risk-backend", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/", tags=["Health"])
def root():
    return {
        "project": "LANDSIGHT AI",
        "description": "AI-Based Early Warning and Landslide Risk Monitoring System in NER",
        "status": "Online & Healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "documentation": "/docs",
        "endpoints": {
            "predict_risk": "/api/v1/predict-risk",
            "zones": "/api/v1/zones",
            "ask_ai": "/api/v1/ask",
            "reports": "/api/v1/reports",
            "dispatch_alert": "/api/v1/dispatch-alert",
            "batch_benchmarks": "/api/v1/batch-test-data"
        }
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
