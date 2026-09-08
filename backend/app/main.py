from fastapi import FastAPI

app = FastAPI(
    title="ParvatRakshak AI",
    description="AI-Based Early Warning and Landslide Risk Monitoring System for the North Eastern Region",
    version="1.0.0"
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