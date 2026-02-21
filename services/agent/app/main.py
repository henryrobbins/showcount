from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.parse import router as parse_router

app = FastAPI(title="showcount-agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://showcount.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(parse_router)


@app.get("/")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "showcount-agent"}
