"""Security core: password hashing, JWT, and auth dependencies.

Portable design — the same contract maps cleanly onto Spring Security later
(UserDetailsService + JwtDecoder + method security). Authorization ALWAYS
reloads the user/role from the database; a client-supplied role is never trusted.
"""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import secrets
import uuid

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings
from .db import refresh_sessions, users

bearer = HTTPBearer(auto_error=True)


def now() -> datetime:
    return datetime.now(timezone.utc)


# --- Password hashing (bcrypt, work factor 12) ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# --- Token helpers ---
def token_hash(raw: str) -> str:
    return sha256(raw.encode("utf-8")).hexdigest()


def public_user(u: dict) -> dict:
    """User shape returned to the client (matches the RN `User` type)."""
    return {
        "id": u["_id"],
        "fullName": u.get("full_name", ""),
        "email": u["email"],
        "role": u.get("role", "ROLE_USER"),
        "currency": u.get("currency", "EUR"),
        "dailyLimit": u.get("daily_limit", 150),
        "createdAt": (u.get("created_at") or now()).isoformat()
        if isinstance(u.get("created_at"), datetime)
        else u.get("created_at"),
        "active": u.get("active", True),
    }


def make_access_token(u: dict) -> str:
    t = now()
    return jwt.encode(
        {
            "sub": u["_id"],
            "jti": str(uuid.uuid4()),
            "type": "access",
            "role": u.get("role", "ROLE_USER"),
            "iat": t,
            "exp": t + timedelta(minutes=settings.access_minutes),
            "iss": settings.jwt_issuer,
            "aud": settings.jwt_audience,
        },
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


async def issue_token_pair(u: dict) -> dict:
    raw_refresh = secrets.token_urlsafe(64)
    await refresh_sessions.insert_one(
        {
            "user_id": u["_id"],
            "token_hash": token_hash(raw_refresh),
            "family_id": str(uuid.uuid4()),
            "created_at": now(),
            "expires_at": now() + timedelta(days=settings.refresh_days),
            "revoked_at": None,
        }
    )
    return {
        "accessToken": make_access_token(u),
        "refreshToken": raw_refresh,
        "user": public_user(u),
    }


async def rotate_refresh_token(raw_refresh: str) -> dict:
    old = await refresh_sessions.find_one_and_update(
        {"token_hash": token_hash(raw_refresh), "revoked_at": None, "expires_at": {"$gt": now()}},
        {"$set": {"revoked_at": now()}},
    )
    if not old:
        raise HTTPException(status_code=401, detail="Invalid or reused refresh token")
    u = await users.find_one({"_id": old["user_id"], "active": {"$ne": False}})
    if not u:
        raise HTTPException(status_code=401, detail="User unavailable")
    return await issue_token_pair(u)


async def revoke_refresh_token(raw_refresh: str) -> None:
    await refresh_sessions.update_one(
        {"token_hash": token_hash(raw_refresh), "revoked_at": None},
        {"$set": {"revoked_at": now()}},
    )


# --- Dependencies ---
async def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    error = HTTPException(status_code=401, detail="Invalid access token")
    try:
        payload = jwt.decode(
            creds.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
        )
        if payload.get("type") != "access" or not payload.get("sub"):
            raise error
    except jwt.PyJWTError:
        raise error
    u = await users.find_one({"_id": payload["sub"], "active": {"$ne": False}})
    if not u:
        raise error
    return u


def require_role(role: str):
    async def dep(u: dict = Depends(current_user)) -> dict:
        if u.get("role") != role:
            raise HTTPException(status_code=403, detail="Forbidden")
        return u

    return dep
