from datetime import date
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    fullName: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class OnboardingRequest(BaseModel):
    firstName: str = Field(min_length=1, max_length=80)
    age: int = Field(ge=18, le=100)
    gender: Literal["man", "woman", "other"]
    bio: str = Field(min_length=10, max_length=500)
    city: str = Field(min_length=2, max_length=120)
    state: str | None = Field(default=None, min_length=2, max_length=120)
    country: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, min_length=7, max_length=30)
    dob: date | None = None
    interests: list[str] = Field(min_length=3, max_length=5)
    photoUrls: list[str] = Field(min_length=1, max_length=6)


class CloudinarySignatureRequest(BaseModel):
    folder: str = "stealmyheart/profiles"


class SwipeRequest(BaseModel):
    swipedId: UUID
    direction: bool  # TRUE = like, FALSE = pass
