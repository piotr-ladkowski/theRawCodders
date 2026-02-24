import json
from typing import Any

from openai import AsyncOpenAI

from config import settings
from convex_client import fetch_all
from analyzers import (
    analyze_temporal,
    analyze_demographics,
    analyze_products,
    analyze_transactions,
    analyze_returns,
)

SYSTEM_PROMPT = """You are a senior business analyst for an e-commerce platform.
You will receive JSON data containing statistical analyses of the platform's clients,
products, transactions, orders, and returns.

Produce a structured report with:
1. **Executive Summary** — 2-3 sentence overview of the business health.
2. **Key Findings** — grouped by category (Temporal Trends, Customer Demographics,
   Product Performance, Transaction Patterns, Returns Analysis). Each finding should
   reference the specific numbers from the data.
3. **Actionable Recommendations** — concrete, prioritized steps the business should take.
4. **Marketing Actions** — 5-8 specific, creative marketing campaign ideas based on the data.
   For each action include: a catchy campaign name, the target audience segment,
   the channel (email, social media, in-app, SMS, etc.), expected impact, and a brief
   description of the campaign. Base these on actual patterns in the data — e.g. if a
   demographic spends more, target them; if certain products are often co-purchased,
   create bundles; if there's a peak day/hour, time promotions accordingly.

Be data-driven. Cite numbers. Flag any statistically significant results.
Keep the tone professional but accessible."""


def _make_serializable(obj: Any) -> Any:
    """Convert numpy/pandas types to native Python for JSON serialization."""
    import numpy as np

    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, dict):
        return {str(k): _make_serializable(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_make_serializable(i) for i in obj]
    return obj


async def run_pipeline() -> dict:
    """Run all analyzers and send results to OpenAI for narrative generation."""
    data = await fetch_all()

    # Run all analyses
    raw_metrics = {
        "temporal": analyze_temporal(data.get("transactions", [])),  # list of transaction rows
        "demographics": analyze_demographics(data),                  # full dict of tables
        "products": analyze_products(data),                          # likely full dict
        "transactions": analyze_transactions(data),                  # likely full dict
        "returns": analyze_returns(data),                            # likely full dict
    }

    raw_metrics = _make_serializable(raw_metrics)

    # Send to OpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    response = await client.chat.completions.create(
        model="gpt-4o",
        temperature=0.3,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Here is the analysis data:\n\n```json\n{json.dumps(raw_metrics, indent=2)}\n```",
            },
        ],
    )

    narrative = response.choices[0].message.content

    # Parse the narrative into sections
    sections = _parse_narrative(narrative)

    return {
        "executive_summary": sections.get("executive_summary", narrative),
        "key_findings": sections.get("key_findings", {}),
        "recommendations": sections.get("recommendations", []),
        "marketing_actions": sections.get("marketing_actions", []),
        "raw_metrics": raw_metrics,
    }


def _parse_narrative(text: str) -> dict:
    """Best-effort parse of the LLM narrative into structured sections."""
    result: dict[str, Any] = {}
    lines = text.split("\n")
    current_section = None
    current_content: list[str] = []

    section_map = {
        "executive summary": "executive_summary",
        "key findings": "key_findings",
        "actionable recommendations": "recommendations",
        "recommendations": "recommendations",
        "marketing actions": "marketing_actions",
        "marketing campaigns": "marketing_actions",
    }

    def flush():
        nonlocal current_section, current_content
        if current_section and current_content:
            content = "\n".join(current_content).strip()
            if current_section in ("recommendations", "marketing_actions"):
                # Split into list items
                items = [
                    line.lstrip("0123456789.-) ").strip()
                    for line in content.split("\n")
                    if line.strip() and not line.strip().startswith("#")
                ]
                result[current_section] = [i for i in items if i]
            elif current_section == "key_findings":
                result[current_section] = {"narrative": content}
            else:
                result[current_section] = content
        current_content = []

    for line in lines:
        stripped = line.strip().lstrip("#").strip().lower()
        matched = False
        for keyword, key in section_map.items():
            if keyword in stripped and len(stripped) < 50:
                flush()
                current_section = key
                matched = True
                break
        if not matched:
            current_content.append(line)

    flush()
    return result
