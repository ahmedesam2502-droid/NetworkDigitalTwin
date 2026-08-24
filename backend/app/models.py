from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    ip_address: Mapped[str] = mapped_column(
        String(45),
        unique=True,
        nullable=False
    )

    device_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="offline",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class Connection(Base):
    __tablename__ = "connections"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    source_device_id: Mapped[int] = mapped_column(
        ForeignKey("devices.id"),
        nullable=False
    )

    target_device_id: Mapped[int] = mapped_column(
        ForeignKey("devices.id"),
        nullable=False
    )

    connection_type: Mapped[str] = mapped_column(
        String(50),
        default="ethernet",
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default="up",
        nullable=False
    )
    
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False
    )
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    is_verified: Mapped[bool] = mapped_column(
        default=False,
        nullable=False
    )

    verification_code: Mapped[str | None] = mapped_column(
        String(6),
        nullable=True
    )

    verification_code_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )