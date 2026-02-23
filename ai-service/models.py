from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"


class InsightsResponse(BaseModel):
    executive_summary: str
    key_findings: dict
    recommendations: list[str]
    raw_metrics: dict
