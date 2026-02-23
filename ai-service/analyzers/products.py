from typing import Any
from collections import Counter
from itertools import combinations

import pandas as pd
from scipy import stats

def _rows(payload):
    if isinstance(payload, dict):
        return payload.get("data", [])
    return payload if isinstance(payload, list) else []

def analyze_products(data: dict[str, list[dict[str, Any]]]) -> dict:
    """Analyze product performance, co-purchases, and return rates."""
    products = _rows(data.get("products", []))
    orders = _rows(data.get("orders", []))
    returns = _rows(data.get("returns", []))
    transactions = _rows(data.get("transactions", []))

    if not products or not orders:
        return {"error": "Insufficient data for product analysis"}

    products_df = pd.DataFrame(products)
    orders_df = pd.DataFrame(orders)
    returns_df = pd.DataFrame(returns) if returns else pd.DataFrame()
    trans_df = pd.DataFrame(transactions) if transactions else pd.DataFrame()

    product_col = "productId" if "productId" in orders_df.columns else "product_id" if "product_id" in orders_df.columns else None
    if product_col is None:
        raise KeyError(f"Missing productId/product_id in orders_df. Columns: {orders_df.columns.tolist()}")

    # Build product lookup
    product_map = {p["_id"]: p for p in products}

    # Top 10 by quantity sold
    qty_by_product = orders_df.groupby(product_col)["quantity"].sum().sort_values(ascending=False)
    top10_qty = {
        product_map.get(pid, {}).get("name", pid): int(qty)
        for pid, qty in qty_by_product.head(10).items()
    }

    # Top 10 by revenue
    orders_df["price"] = orders_df[product_col].map(
        lambda pid: product_map.get(pid, {}).get("price", 0)
    )
    orders_df["revenue"] = orders_df["price"] * orders_df["quantity"]
    rev_by_product = orders_df.groupby(product_col)["revenue"].sum().sort_values(ascending=False)
    top10_revenue = {
        product_map.get(pid, {}).get("name", pid): round(float(rev), 2)
        for pid, rev in rev_by_product.head(10).items()
    }

    # Co-purchase pairs (products bought in the same transaction)
    co_purchase_counter = Counter()
    for tid, group in orders_df.groupby("transactionId"):
        product_ids = group["productId"].unique().tolist()
        for a, b in combinations(sorted(product_ids), 2):
            name_a = product_map.get(a, {}).get("name", a)
            name_b = product_map.get(b, {}).get("name", b)
            co_purchase_counter[(name_a, name_b)] += 1

    top_co_purchases = [
        {"pair": list(pair), "count": count}
        for pair, count in co_purchase_counter.most_common(10)
    ]

    # Return rates by product
    return_rates_by_product = {}
    if not returns_df.empty:
        order_product = orders_df.set_index("_id")["productId"]
        returns_df["productId"] = returns_df["orderId"].map(order_product)
        returns_by_product = returns_df.groupby("productId").size()
        orders_by_product = orders_df.groupby("productId").size()
        for pid in returns_by_product.index:
            total_orders = orders_by_product.get(pid, 1)
            rate = returns_by_product[pid] / total_orders if total_orders > 0 else 0
            name = product_map.get(pid, {}).get("name", pid)
            return_rates_by_product[name] = round(float(rate), 4)
        return_rates_by_product = dict(
            sorted(return_rates_by_product.items(), key=lambda x: x[1], reverse=True)[:10]
        )

    # Pearson correlation: price vs quantity sold
    correlation_result = None
    if len(products_df) > 2:
        product_qty = qty_by_product.reindex(products_df["_id"], fill_value=0)
        r, p = stats.pearsonr(products_df["price"].values, product_qty.values)
        correlation_result = {
            "pearson_r": round(float(r), 4),
            "p_value": round(float(p), 4),
            "interpretation": (
                "significant negative" if p < 0.05 and r < 0
                else "significant positive" if p < 0.05 and r > 0
                else "not significant"
            ),
        }

    return {
        "top10_by_quantity": top10_qty,
        "top10_by_revenue": top10_revenue,
        "top_co_purchases": top_co_purchases,
        "return_rates_by_product": return_rates_by_product,
        "price_vs_quantity_correlation": correlation_result,
        "total_products": len(products_df),
        "total_orders": len(orders_df),
    }
