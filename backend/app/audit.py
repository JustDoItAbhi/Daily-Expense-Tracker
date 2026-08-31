"""Audit logging for security-sensitive events.

Records WHAT happened and WHO/WHERE — never secrets (no passwords, tokens,
JWTs, or full expense contents).
"""
from datetime import datetime, timezone
from typing import Optional

from .db import audit_events

LOGIN = "LOGIN"
LOGOUT = "LOGOUT"
ACCOUNT_CREATED = "ACCOUNT_CREATED"
DEVICE_REGISTERED = "DEVICE_REGISTERED"
ADMIN_ACTION = "ADMIN_ACTION"
TOKEN_REFRESHED = "TOKEN_REFRESHED"


async def log_event(
    action: str,
    user_id: Optional[str] = None,
    device_id: Optional[str] = None,
    meta: Optional[dict] = None,
) -> None:
    await audit_events.insert_one(
        {
            "action": action,
            "user_id": user_id,
            "device_id": device_id,
            "meta": meta or {},
            "created_at": datetime.now(timezone.utc),
        }
    )
