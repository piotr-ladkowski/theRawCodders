from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any

# Assuming you've updated models.py, pipeline.py, and report_generator.py
# based on the previous Mountain Rescue steps.
from models import AnalysisResult
from pipeline import run_pipeline, generate_personnel_summary
from report_generator import generate_pdf

import traceback

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


@app.post("/personnel-summary", response_model=PersonnelSummaryResponse)
async def personnel_summary(data: PersonnelSummaryRequest):
    """Generate a short AI tactical profile for a single rescuer/medic/pilot."""
    try:
        summary = await generate_personnel_summary(data.model_dump())
        return PersonnelSummaryResponse(summary=summary)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))