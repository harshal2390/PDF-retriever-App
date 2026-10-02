import os
from typing import List, Dict, Any
from ddgs import DDGS

def search_web(query: str, max_results: int = 3) -> List[Dict[str, Any]]:
    """
    Search the live web using DDGS (or SerpAPI if configured).
    Returns a list of dicts with title, url, and snippet.
    """
    results = []
    
    # Check if SerpAPI is configured
    serpapi_key = os.getenv("SERPAPI_API_KEY")
    if serpapi_key:
        try:
            import requests
            resp = requests.get(
                "https://serpapi.com/search",
                params={"q": query, "api_key": serpapi_key, "num": max_results},
                timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("organic_results", [])[:max_results]:
                    results.append({
                        "title": item.get("title", "Web Result"),
                        "url": item.get("link", ""),
                        "snippet": item.get("snippet", "")
                    })
                if results:
                    return results
        except Exception:
            pass  # Fallback to DDGS

    # Default: High-performance, zero-config DDGS
    try:
        ddgs = DDGS()
        raw_results = list(ddgs.text(query, max_results=max_results))
        for r in raw_results:
            title = r.get("title", "")
            url = r.get("href", "")
            body = r.get("body", "")
            if title and (body or url):
                results.append({
                    "title": title,
                    "url": url,
                    "snippet": body.strip()
                })
    except Exception as e:
        print(f"[WebSearch] Error fetching results for '{query}': {str(e)}")

    return results
