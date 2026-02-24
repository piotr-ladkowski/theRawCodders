import json
import logging
import httpx
from openai import AsyncOpenAI
from config import settings
from models import AnalysisResult, MetricData

logger = logging.getLogger(__name__)

# FIXED: Must be exactly lowercase as defined in config.py
client = AsyncOpenAI(api_key=settings.openai_api_key)


# ADDED: This function was missing! It fetches the data from Convex and passes it to the AI.
async def run_pipeline() -> dict:
    logger.info("Fetching operational data from Convex...")
    
    # Convex HTTP routes use .site instead of .cloud
    http_url = settings.convex_url.replace(".cloud", ".site")
    
    async with httpx.AsyncClient() as http_client:
        response = await http_client.get(f"{http_url}/http/api/export")
        response.raise_for_status()
        data = response.json()
        
    insights = await generate_insights(data)
    
    # Return a dict so main.py can pass it cleanly back to the client
    return insights.model_dump()


async def generate_insights(data: dict) -> AnalysisResult:
    logger.info("Calculating Tactical Metrics...")
    
    incidents = data.get("incidents", [])
    personnel = data.get("personnel", [])
    equipment = data.get("equipment", [])
    maintenance = data.get("maintenance_logs", [])

    # 1. Calculate Operations Metrics
    total_incidents = len(incidents)
    avg_severity = sum(i.get("severityLevel", 1) for i in incidents) / max(total_incidents, 1)
    
    available_personnel = len([p for p in personnel if p.get("isAvailable", False)])
    active_rescuers = len(personnel) - available_personnel

    in_use_eq = len([e for e in equipment if e.get("status") == "In Use"])
    critical_maintenance = len([m for m in maintenance if m.get("issueType") == "Damage"])

    raw_metrics = MetricData(
        incidents={
            "total_incidents": total_incidents, 
            "avg_severity": round(avg_severity, 1), 
            "avg_response_time": "12m" # Placeholder for future GPS timestamp math
        },
        personnel={
            "available_personnel": available_personnel, 
            "active_rescuers": active_rescuers
        },
        equipment={
            "in_use": in_use_eq, 
            "total": len(equipment)
        },
        maintenance={
            "total_logs": len(maintenance), 
            "critical_issues": critical_maintenance
        }
    )

    # 2. Generate AI Tactical Report
    logger.info("Generating AI Analysis via OpenAI...")
    prompt = f"""
    You are an expert AI Tactical Advisor for a Mountain Rescue Command Center.
    Analyze the following operational data and provide a highly actionable intelligence report.
    
    Current Operational Metrics:
    {raw_metrics.model_dump_json()}
    
    Instructions:
    1. 'executive_summary': A 2-sentence tactical overview of current operational readiness.
    2. 'key_findings': A dictionary summarizing risks (e.g., high incident severity vs available personnel). Include a 'narrative' string with bullet points formatted with **bold** headers.
    3. 'recommendations': 3 to 5 concrete steps to improve response capabilities.
    4. 'operational_actions': 2 to 4 immediate, specific orders (e.g., 'Deploy 2 medics to Sector B', 'Ground damaged snowmobiles').
    
    Return ONLY a valid JSON object matching the requested schema exactly.
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.4
        )
        
        result_dict = json.loads(response.choices[0].message.content)
        result_dict["raw_metrics"] = raw_metrics.model_dump()
        
        return AnalysisResult(**result_dict)
        
    except Exception as e:
        logger.error(f"Failed to generate insights: {e}")
        raise e
    

async def generate_dispatch_recommendation(data: dict) -> dict:
    logger.info(f"[dispatch-rec] START - incident_type={data.get('incident_type')}, severity={data.get('severity_level')}")
    logger.info(f"[dispatch-rec] Input data keys: {list(data.keys())}")
    logger.info(f"[dispatch-rec] Available personnel count: {len(data.get('available_personnel', []))}")
    logger.info(f"[dispatch-rec] Available equipment count: {len(data.get('available_equipment', []))}")
    logger.info(f"[dispatch-rec] GPS coordinates: {data.get('gps_coordinates')}")

    personnel_list = "\n".join(
        f"- {p.get('name')} | Role: {p.get('role')} | Certifications: {', '.join(p.get('certifications', []))}"
        for p in data.get("available_personnel", [])
    )
    equipment_list = "\n".join(
        f"- {e.get('name')} | Category: {e.get('category', 'N/A')}"
        for e in data.get("available_equipment", [])
    )

    logger.info(f"[dispatch-rec] Personnel list for prompt:\n{personnel_list or 'None'}")
    logger.info(f"[dispatch-rec] Equipment list for prompt:\n{equipment_list or 'None'}")

    prompt = f"""
    You are an expert AI Tactical Advisor for a Mountain Rescue Command Center.
    A new incident requires immediate dispatch. Recommend the best available personnel and equipment.

    Incident Details:
    - Type: {data['incident_type']}
    - Severity Level: {data['severity_level']} (1=minor, 5=critical)
    - GPS: Lat {data['gps_coordinates'].get('latitude')}, Lng {data['gps_coordinates'].get('longitude')}
    - Weather: {data.get('weather_conditions', 'Unknown')}

    Available Personnel:
    {personnel_list or "None available"}

    Available Equipment:
    {equipment_list or "None available"}

    Instructions:
    - 'recommended_personnel': List the EXACT names of personnel to deploy (pick the most suitable based on role and certifications for this incident type). Pick 1-3 people.
    - 'recommended_equipment': List the EXACT names of equipment to deploy (pick the most suitable for this incident type). Pick 1-4 items.
    - 'rationale': A 1-2 sentence explanation of why these resources are the best fit.

    Return ONLY a valid JSON object with these three keys.
    """

    logger.info("[dispatch-rec] Calling OpenAI GPT-4o...")

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "system", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        raw_content = response.choices[0].message.content
        logger.info(f"[dispatch-rec] OpenAI raw response: {raw_content}")
        result = json.loads(raw_content)
        logger.info(f"[dispatch-rec] Parsed result: {result}")
        return result
    except json.JSONDecodeError as e:
        logger.error(f"[dispatch-rec] JSON parse error: {e}")
        logger.error(f"[dispatch-rec] Raw content was: {raw_content}")
        raise e
    except Exception as e:
        logger.error(f"[dispatch-rec] Failed to generate dispatch recommendation: {type(e).__name__}: {e}")
        raise e


async def generate_personnel_summary(personnel_data: dict) -> str:
    logger.info(f"Generating tactical summary for personnel: {personnel_data.get('name')}")
    
    prompt = f"""
    You are an AI for a Mountain Rescue Command Center. 
    Write a brief, 2-sentence tactical summary of this rescuer's profile and readiness based on their data:
    
    Name: {personnel_data.get('name')}
    Role: {personnel_data.get('role')}
    Certifications: {', '.join(personnel_data.get('certifications', []))}
    Recent Missions: {personnel_data.get('recent_incidents', [])}
    
    Focus on their expertise level and typical incident exposure. Be concise and professional.
    """

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Failed to generate personnel summary: {e}")
        return "Tactical profile generation failed."