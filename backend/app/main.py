from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from .models import Device


app = FastAPI(
    title="Network Digital Twin API",
    version="0.1.0"
)


# Create database tables
Base.metadata.create_all(bind=engine)


# Database session
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Network Digital Twin API is running"
    }


# Health check
@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# Database connection test
@app.get("/db-test")
def database_test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "result": result.scalar()
        }


# Create a new network device
@app.post("/devices")
def create_device(
    name: str,
    ip_address: str,
    device_type: str,
    db: Session = Depends(get_db)
):
    device = Device(
        name=name,
        ip_address=ip_address,
        device_type=device_type
    )

    db.add(device)
    db.commit()
    db.refresh(device)

    return device