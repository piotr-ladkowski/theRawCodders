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