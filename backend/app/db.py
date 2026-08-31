"""MongoDB access (Motor). Single process-level client.

Collections used as the server-side METADATA store (not the primary expense
DB — expenses live locally in SQLite and sync later):
  - users            : accounts + roles + profile
  - refresh_sessions : hashed, rotating refresh tokens (TTL-cleaned)
  - devices          : registered installations
  - audit_events     : security-sensitive event log
"""
from motor.motor_asyncio import AsyncIOMotorClient

from .config import settings

client = AsyncIOMotorClient(settings.mongo_url, serverSelectionTimeoutMS=5000)
db = client[settings.db_name]

users = db.users
refresh_sessions = db.refresh_sessions
devices = db.devices
audit_events = db.audit_events


async def init_db() -> None:
    await users.create_index("email", unique=True)
    await refresh_sessions.create_index("token_hash", unique=True)
    await refresh_sessions.create_index("expires_at", expireAfterSeconds=0)
    await devices.create_index([("user_id", 1), ("device_id", 1)], unique=True)
    await audit_events.create_index("created_at")
