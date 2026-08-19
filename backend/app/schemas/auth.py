from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=128)

class LoginResponseData(BaseModel):
    expires_at: datetime

class UserProfileData(BaseModel):
    id: UUID
    name: str
    username: str
    phone: str | None = None

class ActiveContextData(BaseModel):
    restaurant_id: UUID
    restaurant_name: str
    location_id: UUID | None = None
    location_name: str | None = None

class LocationInfo(BaseModel):
    location_id: UUID
    name: str

class MembershipInfo(BaseModel):
    restaurant_id: UUID
    restaurant_name: str
    roles: list[str]
    permissions: list[str]
    locations: list[LocationInfo]

class MeResponseData(BaseModel):
    user: UserProfileData
    active_context: ActiveContextData
    memberships: list[MembershipInfo]
