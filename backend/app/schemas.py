"""API DTOs (request/response contracts). Kept separate from persistence docs."""
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterIn(BaseModel):
    fullName: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshIn(BaseModel):
    refreshToken: str = Field(min_length=20)


class DeviceIn(BaseModel):
    deviceId: str = Field(min_length=1, max_length=128)
    deviceName: Optional[str] = Field(default=None, max_length=120)
    platform: Optional[str] = Field(default=None, max_length=40)
    appVersion: Optional[str] = Field(default=None, max_length=40)
    runtimeVersion: Optional[str] = Field(default=None, max_length=40)


class UpdateMeIn(BaseModel):
    fullName: Optional[str] = Field(default=None, min_length=1, max_length=120)
    currency: Optional[str] = Field(default=None, max_length=8)
    dailyLimit: Optional[float] = Field(default=None, ge=0)


class AdminUserPatch(BaseModel):
    active: Optional[bool] = None
