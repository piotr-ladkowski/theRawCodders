from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class MetricData(BaseModel):
    incidents: Dict[str, Any]
    personnel: Dict[str, Any]
    equipment: Dict[str, Any]
    maintenance: Dict[str, Any]

class AnalysisResult(BaseModel):
    executive_summary: str
    key_findings: Dict[str, Any]
    recommendations: List[str]
    operational_actions: List[str] = Field(default_factory=list) # Replaces marketing_actions
    raw_metrics: MetricData


class DispatchRecommendationRequest(BaseModel):
    incident_type: str
    severity_level: int
    gps_coordinates: Dict[str, float]
    weather_conditions: Optional[str] = None
    available_personnel: List[Dict[str, Any]]
    available_equipment: List[Dict[str, Any]]


class DispatchRecommendationResponse(BaseModel):
    recommended_personnel: List[str]
    recommended_equipment: List[str]
    rationale: str