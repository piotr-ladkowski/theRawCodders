from typing import Any

import pandas as pd
from scipy.stats import chi2_contingency


def analyze_transactions(data: dict[str, list[dict[str, Any]]]) -> dict:
    """Analyze transaction patterns: basket size, discounts, cancellations."""
    transactions = data["transactions"]
    orders = data["orders"]

    if not transactions or not orders:
        return {"error": "Insufficient data for transaction analysis"}

    trans_df = pd.DataFrame(transactions)
    orders_df = pd.DataFrame(orders)

    # Basket size (number of order lines per transaction)
    basket_sizes = orders_df.groupby("transactionId").size()
    avg_basket_size = round(float(basket_sizes.mean()), 2)
    median_basket_size = float(basket_sizes.median())

    # Average order value
    avg_order_value = round(float(trans_df["totalPrice"].mean()), 2)
    median_order_value = round(float(trans_df["totalPrice"].median()), 2)

    # Status distribution
    status_dist = trans_df["status"].value_counts().to_dict()

    # Discount impact: has_discount vs completion rate (chi-squared)
    trans_df["has_discount"] = trans_df["discount"] > 0
    trans_df["is_completed"] = trans_df["status"] == "completed"

    chi2_result = None
    contingency = pd.crosstab(trans_df["has_discount"], trans_df["is_completed"])
    if contingency.shape == (2, 2):
        chi2, p, dof, expected = chi2_contingency(contingency)
        chi2_result = {
            "chi2_statistic": round(float(chi2), 4),
            "p_value": round(float(p), 4),
            "significant": bool(p < 0.05),
            "contingency_table": {str(k): {str(k2): int(v2) for k2, v2 in v.items()} for k, v in contingency.to_dict().items()},
        }

    # Discount stats
    discounted = trans_df[trans_df["has_discount"]]
    non_discounted = trans_df[~trans_df["has_discount"]]
    discount_stats = {
        "discounted_count": len(discounted),
        "non_discounted_count": len(non_discounted),
        "avg_value_discounted": round(float(discounted["totalPrice"].mean()), 2) if len(discounted) > 0 else 0,
        "avg_value_non_discounted": round(float(non_discounted["totalPrice"].mean()), 2) if len(non_discounted) > 0 else 0,
        "completion_rate_discounted": round(float(discounted["is_completed"].mean()), 4) if len(discounted) > 0 else 0,
        "completion_rate_non_discounted": round(float(non_discounted["is_completed"].mean()), 4) if len(non_discounted) > 0 else 0,
    }

    # Cancellation analysis
    cancelled = trans_df[trans_df["status"] == "cancelled"]
    cancellation_analysis = {
        "total_cancelled": len(cancelled),
        "cancellation_rate": round(len(cancelled) / len(trans_df), 4) if len(trans_df) > 0 else 0,
        "avg_cancelled_value": round(float(cancelled["totalPrice"].mean()), 2) if len(cancelled) > 0 else 0,
    }

    return {
        "avg_basket_size": avg_basket_size,
        "median_basket_size": median_basket_size,
        "avg_order_value": avg_order_value,
        "median_order_value": median_order_value,
        "status_distribution": status_dist,
        "chi2_discount_vs_completion": chi2_result,
        "discount_stats": discount_stats,
        "cancellation_analysis": cancellation_analysis,
        "total_transactions": len(trans_df),
    }
