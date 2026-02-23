from typing import Any

import pandas as pd


def analyze_returns(data: dict[str, list[dict[str, Any]]]) -> dict:
    """Analyze return reason distribution, rates by product and demographics."""
    returns = data["returns"]
    orders = data["orders"]
    transactions = data["transactions"]
    clients = data["clients"]
    products = data["products"]

    if not returns:
        return {"error": "No returns data available", "total_returns": 0}

    returns_df = pd.DataFrame(returns)
    orders_df = pd.DataFrame(orders) if orders else pd.DataFrame()
    trans_df = pd.DataFrame(transactions) if transactions else pd.DataFrame()
    clients_df = pd.DataFrame(clients) if clients else pd.DataFrame()
    products_df = pd.DataFrame(products) if products else pd.DataFrame()

    # Reason distribution
    reason_dist = returns_df["reason"].value_counts().to_dict()

    # Overall return rate (returns / total orders)
    total_orders = len(orders_df) if not orders_df.empty else 1
    overall_return_rate = round(len(returns_df) / total_orders, 4)

    # Return rates by product
    rates_by_product = {}
    if not orders_df.empty and not products_df.empty:
        product_map = {p["_id"]: p.get("name", p["_id"]) for p in products}
        order_product = orders_df.set_index("_id")["productId"]
        returns_df["productId"] = returns_df["orderId"].map(order_product)
        returns_by_product = returns_df.groupby("productId").size()
        orders_by_product = orders_df.groupby("productId").size()

        for pid in returns_by_product.index:
            total = orders_by_product.get(pid, 1)
            rate = returns_by_product[pid] / total if total > 0 else 0
            name = product_map.get(pid, str(pid))
            rates_by_product[name] = round(float(rate), 4)

        rates_by_product = dict(
            sorted(rates_by_product.items(), key=lambda x: x[1], reverse=True)[:10]
        )

    # Return rates by demographics (sex)
    rates_by_sex = {}
    if not orders_df.empty and not trans_df.empty and not clients_df.empty:
        order_trans = orders_df.set_index("_id")["transactionId"]
        returns_df["transactionId"] = returns_df["orderId"].map(order_trans)

        trans_client = trans_df.set_index("_id")["clientId"]
        returns_df["clientId"] = returns_df["transactionId"].map(trans_client)

        client_sex = clients_df.set_index("_id")["sex"]
        returns_df["sex"] = returns_df["clientId"].map(client_sex)

        sex_return_counts = returns_df.groupby("sex").size()
        # Total orders by sex
        trans_df["clientId_col"] = trans_df["clientId"]
        merged_orders = orders_df.merge(
            trans_df[["_id", "clientId_col"]],
            left_on="transactionId",
            right_on="_id",
            how="left",
            suffixes=("", "_trans"),
        )
        merged_orders["sex"] = merged_orders["clientId_col"].map(client_sex)
        total_orders_by_sex = merged_orders.groupby("sex").size()

        for sex in sex_return_counts.index:
            total = total_orders_by_sex.get(sex, 1)
            rates_by_sex[sex] = round(float(sex_return_counts[sex] / total), 4) if total > 0 else 0

    return {
        "reason_distribution": reason_dist,
        "overall_return_rate": overall_return_rate,
        "top_return_rates_by_product": rates_by_product,
        "return_rates_by_sex": rates_by_sex,
        "total_returns": len(returns_df),
        "total_orders": total_orders,
    }
