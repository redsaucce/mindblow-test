from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router
from app.config import settings

app = FastAPI(title="MindBlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
    # Custom response headers the frontend needs to read via fetch() must be
    # explicitly allowlisted here — browsers block JS access to any response
    # header not listed in Access-Control-Expose-Headers, regardless of
    # whether the server sent it. Centralized here rather than set per-route,
    # so every custom header the frontend needs stays visible in one place.
    expose_headers=["X-Failed-Titles"],
)

app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok"}