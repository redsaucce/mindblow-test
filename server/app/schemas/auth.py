from pydantic import BaseModel, EmailStr


class MagicLinkRequest(BaseModel):
    email: EmailStr


class MagicLinkResponse(BaseModel):
    message: str


class VerifyResponse(BaseModel):
    role: str


class RefreshResponse(BaseModel):
    role: str


class LogoutResponse(BaseModel):
    message: str


class MeResponse(BaseModel):
    id: str
    email: EmailStr
    role: str