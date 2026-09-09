from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes.prediction import router as prediction_router
from backend.app.routes.locations import router as locations_router
from backend.app.routes.weather import router as weather_router


app = FastAPI(
    title="ParvatRakshak AI",
    description=(
        "AI-Based Early Warning and Landslide Risk "
        "Monitoring System for the North Eastern Region"
    ),
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "project": "ParvatRakshak AI",
        "status": "running",
        "message": "Landslide Risk Monitoring System is active"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


app.include_router(prediction_router)
app.include_router(locations_router)
app.include_router(weather_router)
