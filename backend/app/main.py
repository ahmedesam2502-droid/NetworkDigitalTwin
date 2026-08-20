from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from .models import Device, Connection


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


# Get all network devices
@app.get("/devices")
def get_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).all()

    return devices


# Get one network device by ID
@app.get("/devices/{device_id}")
def get_device(
    device_id: int,
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id).first()

    if device is None:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    return device


# Update a network device
@app.put("/devices/{device_id}")
def update_device(
    device_id: int,
    name: str,
    ip_address: str,
    device_type: str,
    status: str,
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id).first()

    if device is None:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    device.name = name
    device.ip_address = ip_address
    device.device_type = device_type
    device.status = status

    db.commit()
    db.refresh(device)

    return device


# Delete a network device
@app.delete("/devices/{device_id}")
def delete_device(
    device_id: int,
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(Device.id == device_id).first()

    if device is None:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    db.delete(device)
    db.commit()

    return {
        "message": "Device deleted successfully",
        "device_id": device_id
    }


# Create a connection between two devices
@app.post("/connections")
def create_connection(
    source_device_id: int,
    target_device_id: int,
    connection_type: str = "ethernet",
    db: Session = Depends(get_db)
):
    source_device = db.query(Device).filter(
        Device.id == source_device_id
    ).first()

    target_device = db.query(Device).filter(
        Device.id == target_device_id
    ).first()

    if source_device is None:
        raise HTTPException(
            status_code=404,
            detail="Source device not found"
        )

    if target_device is None:
        raise HTTPException(
            status_code=404,
            detail="Target device not found"
        )

    if source_device_id == target_device_id:
        raise HTTPException(
            status_code=400,
            detail="A device cannot connect to itself"
        )

    connection = Connection(
        source_device_id=source_device_id,
        target_device_id=target_device_id,
        connection_type=connection_type,
        status="up"
    )

    db.add(connection)
    db.commit()
    db.refresh(connection)

    return connection

# Get all network connections
@app.get("/connections")
def get_connections(db: Session = Depends(get_db)):
    connections = db.query(Connection).all()

    return connections


# Get complete network topology
@app.get("/topology")
def get_topology(db: Session = Depends(get_db)):
    devices = db.query(Device).all()
    connections = db.query(Connection).all()

    return {
        "devices": [
            {
                "id": device.id,
                "name": device.name,
                "ip_address": device.ip_address,
                "device_type": device.device_type,
                "status": device.status
            }
            for device in devices
        ],
        "connections": [
            {
                "id": connection.id,
                "source_device_id": connection.source_device_id,
                "target_device_id": connection.target_device_id,
                "connection_type": connection.connection_type,
                "status": connection.status
            }
            for connection in connections
        ]
    }