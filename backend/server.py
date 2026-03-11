from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI()

RAILWAY_BACKEND_URL = "https://my-sports-app-testing.up.railway.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "proxy_target": RAILWAY_BACKEND_URL}

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def proxy_to_railway(request: Request, path: str):
    target_url = f"{RAILWAY_BACKEND_URL}/api/{path}"
    
    headers = dict(request.headers)
    headers.pop("host", None)
    headers.pop("content-length", None)
    headers.pop("origin", None)
    headers.pop("referer", None)
    headers.pop("sec-fetch-site", None)
    headers.pop("sec-fetch-mode", None)
    headers.pop("sec-fetch-dest", None)
    
    body = await request.body()
    
    params = dict(request.query_params)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body if body else None,
            params=params,
        )
    
    response_headers = dict(response.headers)
    response_headers.pop("content-encoding", None)
    response_headers.pop("content-length", None)
    response_headers.pop("transfer-encoding", None)
    
    from fastapi.responses import Response
    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=response_headers,
    )
