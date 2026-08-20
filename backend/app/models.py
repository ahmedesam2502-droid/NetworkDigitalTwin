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