"""Idempotent admin/demo seeding.

Uses `$setOnInsert` so reruns never overwrite a changed password. Demo/admin
ids are fixed (`u_demo`, `u_admin`) so they line up with the locally-seeded
demo expenses on the device, preserving existing test scenarios. Seed
credentials come from environment — never hard-coded in source.
"""
from .config import settings
from .db import users
from .security import hash_password, now


async def _upsert(user_id: str, email: str, password: str, full_name: str, role: str, daily_limit: int):
    if not email or not password:
        return
    await users.update_one(
        {"email": email.lower()},
        {
            "$setOnInsert": {
                "_id": user_id,
                "email": email.lower(),
                "password_hash": hash_password(password),
                "full_name": full_name,
                "role": role,
                "currency": "EUR",
                "daily_limit": daily_limit,
                "active": True,
                "created_at": now(),
                "updated_at": now(),
            }
        },
        upsert=True,
    )


async def seed() -> None:
    await _upsert(settings.admin_id, settings.admin_email, settings.admin_password, "Admin User", "ROLE_ADMIN", 200)
    await _upsert(settings.demo_id, settings.demo_email, settings.demo_password, "Demo User", "ROLE_USER", 150)
