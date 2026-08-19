from fastapi import FastAPI

app = FastAPI(
    title="Network Digital Twin API",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "message": "Network Digital Twin API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }