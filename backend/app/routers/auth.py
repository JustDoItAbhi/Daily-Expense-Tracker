"""Auth endpoints — /api/v1/auth/*.

Portable to Spring Boot's `AuthController`: thin controller, logic in security
helpers (service layer analog).
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request

from .. import audit
from ..config import settings
from ..db import users
from ..schemas import LoginIn, RefreshIn, RegisterIn
from ..security import (
    current_user,
    hash_password,
    issue_token_pair,
    now,
    public_user,
    revoke_refresh_token,
    rotate_refresh_token,
    verify_password,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register")
async def register(body: RegisterIn):
    email = body.email.lower().strip()
    if await users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Email already registered")
    doc = {
        "_id": f"u_{uuid.uuid4().hex}",
        "email": email,
        "password_hash": hash_password(body.password),
        "full_name": body.fullName.strip(),
        "role": "ROLE_USER",
        "currency": "EUR",
        "daily_limit": 150,
        "active": True,
        "created_at": now(),
        "updated_at": now(),
    }
    try:
        await users.insert_one(doc)
    except Exception:
        raise HTTPException(status_code=409, detail="Email already registered")
    await audit.log_event(audit.ACCOUNT_CREATED, user_id=doc["_id"])
    return await issue_token_pair(doc)


@router.post("/login")
async def login(body: LoginIn, request: Request):
    email = body.email.lower().strip()
    u = await users.find_one({"email": email})
    # Constant-ish time: verify against a dummy hash when the user is unknown.
    valid = (
        verify_password(body.password, u["password_hash"])
        if u
        else verify_password(body.password, hash_password("dummy-never-used"))
    )
    if not u or not valid or not u.get("active", True):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    await audit.log_event(audit.LOGIN, user_id=u["_id"])
    return await issue_token_pair(u)


@router.post("/refresh")
async def refresh(body: RefreshIn):
    pair = await rotate_refresh_token(body.refreshToken)
    await audit.log_event(audit.TOKEN_REFRESHED, user_id=pair["user"]["id"])
    return pair


@router.post("/logout", status_code=204)
async def logout(body: RefreshIn):
    await revoke_refresh_token(body.refreshToken)


@router.get("/me")
async def me(u: dict = Depends(current_user)):
    return public_user(u)
