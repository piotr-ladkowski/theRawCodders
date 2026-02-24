from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from models import HealthResponse, InsightsResponse, ClientSummaryRequest, ClientSummaryResponse
from pipeline import run_pipeline, generate_client_summary
from report_generator import PDFReportGenerator

import traceback

app = FastAPI(title="AI Insights Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse()


@app.get("/insights", response_model=InsightsResponse)
async def insights():
    try:
        result = await run_pipeline()
        return InsightsResponse(**result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/insights/report")
async def generate_report(data: InsightsResponse):
    """Generate a PDF report from the provided insights data."""
    try:
        generator = PDFReportGenerator()
        pdf_buffer = generator.generate(data.model_dump())
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=insights-report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/client-summary", response_model=ClientSummaryResponse)
async def client_summary(data: ClientSummaryRequest):
    """Generate a short AI summary for a single client."""
    try:
        summary = await generate_client_summary(data.model_dump())
        return ClientSummaryResponse(summary=summary)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
