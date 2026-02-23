from typing import Any

import pandas as pd


def analyze_temporal(data: dict[str, list[dict[str, Any]]]) -> dict:
    """Analyze temporal patterns across transactions and orders."""
    transactions = data["transactions"]
    if not transactions:
        return {"error": "No transactions data available"}

    df = pd.DataFrame(transactions)
    df["created"] = pd.to_datetime(df["date"], format="mixed", utc=True)

    day_of_week = (
        df["created"]
        .dt.day_name()
        .value_counts()
        .reindex(
            ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            fill_value=0,
        )
        .to_dict()
    )

    hourly = df["created"].dt.hour.value_counts().sort_index().to_dict()
    hourly = {str(k): int(v) for k, v in hourly.items()}

    monthly = df["created"].dt.to_period("M").astype(str).value_counts().sort_index().to_dict()

    return {
        "transactions_by_day_of_week": day_of_week,
        "transactions_by_hour": hourly,
        "transactions_by_month": monthly,
        "total_transactions": len(df),
    }
 