from typing import Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"


class InsightsResponse(BaseModel):
    executive_summary: str
    key_findings: dict
    recommendations: list[str]
    marketing_actions: list[str]
    raw_metrics: dict


class ClientSummaryRequest(BaseModel):
    name: str
    totalSpending: float
    totalOrders: int
    totalReturns: int
    returnRate: float
    averageRating: Optional[float]
    totalRatings: int
    reviewList: list[str]


class ClientSummaryResponse(BaseModel):
    summary: str
