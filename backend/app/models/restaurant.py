import uuid
from sqlalchemy import String, ForeignKey, UniqueConstraint, Boolean, Numeric, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.models.base import AuditMixin

class Restaurant(Base, AuditMixin):
    __tablename__ = "restaurants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    tax_id: Mapped[str | None] = mapped_column(String(50), nullable=True)

    locations: Mapped[list["Location"]] = relationship(back_populates="restaurant", cascade="all, delete-orphan")
    memberships: Mapped[list["RestaurantMembership"]] = relationship(back_populates="restaurant", cascade="all, delete-orphan")
    configuration: Mapped["RestaurantConfiguration"] = relationship(back_populates="restaurant", uselist=False, cascade="all, delete-orphan")

class Location(Base, AuditMixin):
    __tablename__ = "locations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str | None] = mapped_column(nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    restaurant: Mapped["Restaurant"] = relationship(back_populates="locations")
    tables: Mapped[list["Table"]] = relationship(back_populates="location", cascade="all, delete-orphan")
    configuration: Mapped["LocationConfiguration"] = relationship(back_populates="location", uselist=False, cascade="all, delete-orphan")

class RestaurantConfiguration(Base, AuditMixin):
    __tablename__ = "restaurant_configurations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), unique=True, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="₹", nullable=False)
    invoice_format_prefix: Mapped[str] = mapped_column(String(10), default="INV", nullable=False)
    approval_threshold_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=5000.00, nullable=False)
    business_terms: Mapped[str | None] = mapped_column(nullable=True)

    restaurant: Mapped["Restaurant"] = relationship(back_populates="configuration")

class LocationConfiguration(Base, AuditMixin):
    __tablename__ = "location_configurations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    location_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("locations.id", ondelete="CASCADE"), unique=True, nullable=False)
    tax_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=5.00, nullable=False)
    service_charge_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)
    operating_hours_open: Mapped[str | None] = mapped_column(Time, nullable=True)
    operating_hours_close: Mapped[str | None] = mapped_column(Time, nullable=True)
    table_naming_format: Mapped[str] = mapped_column(String(50), default="T{number}", nullable=False)
    cash_drawer_limit: Mapped[float] = mapped_column(Numeric(12, 2), default=10000.00, nullable=False)

    location: Mapped["Location"] = relationship(back_populates="configuration")

class Table(Base, AuditMixin):
    __tablename__ = "tables"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False)
    location_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    table_number: Mapped[str] = mapped_column(String(10), nullable=False)
    capacity: Mapped[int] = mapped_column(nullable=False)
    section: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="AVAILABLE", nullable=False)
    config_status: Mapped[str] = mapped_column(String(20), default="ACTIVE", nullable=False)

    location: Mapped["Location"] = relationship(back_populates="tables")

    __table_args__ = (
        UniqueConstraint("location_id", "table_number", name="unique_location_table_number"),
    )
