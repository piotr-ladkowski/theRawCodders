import asyncio
import time
from typing import Any

import httpx

from config import settings

_cache: dict[str, tuple[float, list[dict]]] = {}


async def _fetch_table(client: httpx.AsyncClient, function_path: str) -> list[dict]:
    """Fetch a single table via the Convex HTTP query API."""
    resp = await client.post(
        f"{settings.convex_url}/api/query",
        json={"path": function_path, "args": {}},
    )
    resp.raise_for_status()
    data = resp.json()
    return data.get("value", data) if isinstance(data, dict) else data


TABLES = {
    "clients": "clients:listClients",
    "products": "products:listProducts",
    "transactions": "transactions:listTransactions",
    "orders": "orders:listOrders",
    "returns": "returns:listReturns",
}


async def fetch_all() -> dict[str, list[dict[str, Any]]]:
    """Fetch all tables in parallel. Results are cached for CACHE_TTL_SECONDS."""
    now = time.time()
    cache_key = "all_tables"

    if cache_key in _cache:
        cached_at, cached_data = _cache[cache_key]
        if now - cached_at < settings.cache_ttl_seconds:
            return cached_data

    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = {name: _fetch_table(client, path) for name, path in TABLES.items()}
        results = await asyncio.gather(*tasks.values())

    data = dict(zip(tasks.keys(), results))
    _cache[cache_key] = (now, data)
    return data


def invalidate_cache() -> None:
    _cache.clear()
