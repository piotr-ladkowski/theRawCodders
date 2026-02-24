from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

# Assuming you've updated models.py, pipeline.py, and report_generator.py
# based on the previous Mountain Rescue steps.
from models import AnalysisResult, DispatchRecommendationRequest, DispatchRecommendationResponse
from pipeline import run_pipeline, generate_personnel_summary, generate_dispatch_recommendation
from report_generator import generate_pdf

import logging
import traceback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Command Center AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic models for health and personnel summaries
class HealthResponse(BaseModel):
    status: str = "ok"

class PersonnelSummaryRequest(BaseModel):
    name: str
    role: str
    certifications: List[str]
    recent_incidents: List[Dict[str, Any]]

class PersonnelSummaryResponse(BaseModel):
    summary: str


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse()


@app.get("/insights", response_model=AnalysisResult)
async def insights():
    """Fetches operational data from Convex and generates tactical AI insights."""
    try:
        # run_pipeline() should now fetch incidents, equipment, personnel, etc., 
        # and pass them to generate_insights()
        result = await run_pipeline()
        return result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/insights/report")
async def generate_report(data: AnalysisResult):
    """Generate a Tactical PDF report from the provided insights data."""
    try:
        # Pass the validated Pydantic model dump to the PDF generator
        pdf_bytes = generate_pdf(data.model_dump())
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=Command_Insights.pdf"}
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/dispatch-recommendation", response_model=DispatchRecommendationResponse)
async def dispatch_recommendation(data: DispatchRecommendationRequest):
    """Generate AI-powered personnel and equipment recommendations for an incident."""
    logger.info(f"[/dispatch-recommendation] Received request: incident_type={data.incident_type}, severity={data.severity_level}")
    logger.info(f"[/dispatch-recommendation] Personnel count: {len(data.available_personnel)}, Equipment count: {len(data.available_equipment)}")
    try:
        result = await generate_dispatch_recommendation(data.model_dump())
        logger.info(f"[/dispatch-recommendation] Success - returning recommendation")
        return DispatchRecommendationResponse(**result)
    except Exception as e:
        logger.error(f"[/dispatch-recommendation] FAILED: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/personnel-summary", response_model=PersonnelSummaryResponse)
async def personnel_summary(data: PersonnelSummaryRequest):
    """Generate a short AI tactical profile for a single rescuer/medic/pilot."""
    try:
        summary = await generate_personnel_summary(data.model_dump())
        return PersonnelSummaryResponse(summary=summary)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))