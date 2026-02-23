from typing import Any

import pandas as pd
from scipy import stats


def analyze_demographics(data: dict[str, list[dict[str, Any]]]) -> dict:
    """Analyze spending patterns by demographics."""
    clients = data["clients"]
    transactions = data["transactions"]
    if not clients or not transactions:
        return {"error": "Insufficient data for demographics analysis"}

    clients_df = pd.DataFrame(clients)
    trans_df = pd.DataFrame(transactions)

    # Extract city from nested address
    clients_df["city"] = clients_df["address"].apply(
        lambda a: a.get("city", "Unknown") if isinstance(a, dict) else "Unknown"
    )

    # Calculate age from birthDate
    clients_df["birthDate"] = pd.to_datetime(clients_df["birthDate"], errors="coerce", utc=True)
    now = pd.Timestamp.now(tz="UTC")
    clients_df["age"] = (now - clients_df["birthDate"]).dt.days / 365.25
    clients_df["age"] = clients_df["age"].fillna(0).astype(int)
    clients_df["age_group"] = pd.cut(
        clients_df["age"],
        bins=[0, 25, 35, 45, 55, 65, 100],
        labels=["18-25", "26-35", "36-45", "46-55", "56-65", "65+"],
    )

    # Merge transactions with clients
    merged = trans_df.merge(clients_df, left_on="clientId", right_on="_id", how="left")

    # Spending by sex
    spending_by_sex = merged.groupby("sex")["totalPrice"].agg(["mean", "sum", "count"]).to_dict()

    # Mann-Whitney U test for sex spending difference
    mann_whitney_result = None
    male_spending = merged.loc[merged["sex"] == "Male", "totalPrice"].dropna()
    female_spending = merged.loc[merged["sex"] == "Female", "totalPrice"].dropna()
    if len(male_spending) > 0 and len(female_spending) > 0:
        stat, pvalue = stats.mannwhitneyu(male_spending, female_spending, alternative="two-sided")
        mann_whitney_result = {
            "statistic": float(stat),
            "p_value": float(pvalue),
            "significant": bool(pvalue < 0.05),
        }

    # Spending by age group
    spending_by_age = (
        merged.groupby("age_group", observed=True)["totalPrice"]
        .agg(["mean", "sum", "count"])
        .to_dict()
    )

    # Top cities by spending
    top_cities = (
        merged.groupby("city")["totalPrice"]
        .sum()
        .sort_values(ascending=False)
        .head(10)
        .to_dict()
    )

    # Repeat purchase behaviour
    client_tx_counts = trans_df.groupby("clientId").size()
    repeat_customers = int((client_tx_counts > 1).sum())
    one_time_customers = int((client_tx_counts == 1).sum())

    return {
        "spending_by_sex": spending_by_sex,
        "mann_whitney_sex_spending": mann_whitney_result,
        "spending_by_age_group": spending_by_age,
        "top_cities_by_spending": top_cities,
        "repeat_customers": repeat_customers,
        "one_time_customers": one_time_customers,
        "total_unique_customers": int(client_tx_counts.shape[0]),
    }
