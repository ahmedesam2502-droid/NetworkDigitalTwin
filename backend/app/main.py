from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from sqlalchemy import text
from sqlalchemy.orm import Session

from .database import Base, engine, SessionLocal
from .models import Device, Connection, User
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

app = FastAPI(
    title="Network Digital Twin API",
    version="0.1.0"
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://network-digital-twin-jet.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# Database
# =========================

Base.metadata.create_all(bind=engine)


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(credentials.credentials)

    if payload is None:
        raise credentials_exception

    username = payload.get("sub")

    if username is None:
        raise credentials_exception

    user = db.query(User).filter(
        User.username == username
    ).first()

    if user is None:
        raise credentials_exception

    return user


# =========================
# Basic Routes
# =========================

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


@app.get("/db-test")
def database_test():
    with engine.connect() as connection:
         result = connection.execute(text("SELECT 1"))

    return {
            "database": "connected",
            "result": result.scalar()
        }


# =========================
# Authentication
# =========================

@app.post("/register", response_model=Token)
@limiter.limit("5/minute")
def register(
    request: Request,
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    existing_username = db.query(User).filter(
        User.username == user_data.username
    ).first()

    if existing_username is not None:
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )

    existing_email = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_email is not None:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long"
        )

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(
        data={"sub": user.username}
    )

    return Token(access_token=access_token)


@app.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(
    request: Request,
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(
        User.username == credentials.username
    ).first()

    if user is None or not verify_password(
        credentials.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    access_token = create_access_token(
        data={"sub": user.username}
    )

    return Token(access_token=access_token)


@app.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    }


# =========================
# Devices
# =========================

@app.post("/devices")
def create_device(
    name: str,
    ip_address: str,
    device_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if device_type not in ["router", "switch", "server"]:
        raise HTTPException(
            status_code=400,
            detail="Device type must be router, switch, or server"
        )

    if not name.strip():
        raise HTTPException(
            status_code=400,
            detail="Device name cannot be empty"
        )

    existing_device = db.query(Device).filter(
        Device.ip_address == ip_address
    ).first()

    if existing_device is not None:
        raise HTTPException(
            status_code=400,
            detail=f"A device with IP address {ip_address} already exists"
        )

    device = Device(
        name=name,
        ip_address=ip_address,
        device_type=device_type,
        status="offline"
    )

    db.add(device)
    db.commit()
    db.refresh(device)

    return device

@app.get("/devices")
def get_devices(
    db: Session = Depends(get_db)
):
    return db.query(Device).all()


@app.get("/devices/{device_id}")
def get_device(
    device_id: int,
    db: Session = Depends(get_db)
):
    device = db.query(Device).filter(
        Device.id == device_id
    ).first()

    if device is None:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    return device


@app.put("/devices/{device_id}")
@limiter.limit("30/minute")
def update_device(
    request: Request,
    device_id: int,
    name: str,
    ip_address: str,
    device_type: str,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id
    ).first()

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


@app.delete("/devices/{device_id}")
@limiter.limit("30/minute")
def delete_device(
    request: Request,
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id
    ).first()

    if device is None:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    related_connections = db.query(Connection).filter(
        (Connection.source_device_id == device_id) |
        (Connection.target_device_id == device_id)
    ).all()

    deleted_connections_count = len(related_connections)

    for connection in related_connections:
        db.delete(connection)

    db.delete(device)
    db.commit()

    return {
        "message": "Device deleted successfully",
        "device_id": device_id,
        "deleted_connections": deleted_connections_count
    }


# =========================
# Device Monitoring
# =========================

@app.post("/devices/{device_id}/check")
@limiter.limit("30/minute")
def check_device(
    request: Request,
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    device = db.query(Device).filter(
        Device.id == device_id
    ).first()

    if not device:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    import subprocess

    try:
        result = subprocess.run(
            [
                "ping",
                "-n",
                "1",
                "-w",
                "1000",
                device.ip_address
            ],
            capture_output=True,
            text=True,
            timeout=3
        )

        reachable = result.returncode == 0

    except Exception:
        reachable = False

    return {
        "id": device.id,
        "name": device.name,
        "ip_address": device.ip_address,
        "status": device.status,
        "reachable": reachable
    }
'''
        if result.returncode == 0:
            device.status = "online"
        else:
            device.status = "offline"
    except Exception:
        device.status = "offline"

    db.commit()
    db.refresh(device)

    return device
   '''

# =========================
# Connections
# =========================

@app.post("/connections")
@limiter.limit("30/minute")
def create_connection(
    request: Request,
    source_device_id: int,
    target_device_id: int,
    connection_type: str = "ethernet",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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


@app.get("/connections")
def get_connections(
    db: Session = Depends(get_db)
):
    return db.query(Connection).all()


@app.delete("/connections/{connection_id}")
@limiter.limit("30/minute")
def delete_connection(
    request: Request,
    connection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    connection = db.query(Connection).filter(
        Connection.id == connection_id
    ).first()

    if connection is None:
        raise HTTPException(
            status_code=404,
            detail="Connection not found"
        )

    db.delete(connection)
    db.commit()

    return {
        "message": "Connection deleted successfully",
        "connection_id": connection_id
    }

# =========================
# Network Topology
# =========================

@app.get("/topology")
def get_topology(
    db: Session = Depends(get_db)
):
    devices = db.query(Device).order_by(Device.id).all()
    connections = db.query(Connection).order_by(Connection.id).all()

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


# =========================
# Dashboard Statistics
# =========================

@app.get("/dashboard/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db)
):
    devices = db.query(Device).all()
    connections = db.query(Connection).all()

    online_devices = sum(
        1
        for device in devices
        if device.status == "online"
    )

    offline_devices = sum(
        1
        for device in devices
        if device.status == "offline"
    )

    active_connections = sum(
        1
        for connection in connections
        if connection.status == "up"
    )

    down_connections = sum(
        1
        for connection in connections
        if connection.status != "up"
    )

    return {
        "total_devices": len(devices),
        "online_devices": online_devices,
        "offline_devices": offline_devices,
        "total_connections": len(connections),
        "active_connections": active_connections,
        "down_connections": down_connections
    }
@app.post("/devices/check-all")
@limiter.limit("10/minute")
def check_all_devices(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import subprocess

    devices = db.query(Device).all()

    for device in devices:
        try:
            result = subprocess.run(
                ["ping", "-n", "1", "-w", "1000", device.ip_address],
                capture_output=True,
                text=True,
                timeout=3,
            )

            if result.returncode == 0:
                device.status = "online"
            else:
                device.status = "offline"

        except Exception:
            device.status = "offline"

    db.commit()

    return {
        "message": "All devices checked successfully",
        "devices": [
            {
                "id": device.id,
                "name": device.name,
                "ip_address": device.ip_address,
                "status": device.status,
            }
            for device in devices
        ],
    }
@app.post("/devices/{device_id}/simulate")
@limiter.limit("30/minute")
def simulate_device(
    request: Request,
    device_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):  
    device = db.query(Device).filter(
        Device.id == device_id
    ).first()

    if device is None:
        raise HTTPException(
            status_code=404,
            detail="Device not found"
        )

    if status not in ["online", "offline"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be online or offline"
        )

    device.status = status

    db.commit()
    db.refresh(device)

    return device