"""Admin endpoints — /api/v1/admin/*. Authorization enforced SERVER-SIDE.

A tampered mobile client that flips its local role still receives 403 here.
"""
from fastapi import APIRouter, Depends, HTTPException

from .. import audit
from ..db import devices, users
from ..schemas import AdminUserPatch
from ..security import now, public_user, require_role

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

AdminDep = Depends(require_role("ROLE_ADMIN"))


@router.get("/users")
async def list_users(admin: dict = AdminDep):
    rows = await users.find({}).to_list(1000)
    return [public_user(u) for u in rows]


@router.patch("/users/{user_id}")
async def patch_user(user_id: str, body: AdminUserPatch, admin: dict = AdminDep):
    if body.active is None:
        return {"ok": True}
    result = await users.update_one(
        {"_id": user_id}, {"$set": {"active": body.active, "updated_at": now()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    await audit.log_event(
        audit.ADMIN_ACTION,
        user_id=admin["_id"],
        meta={"target": user_id, "active": body.active},
    )
    u = await users.find_one({"_id": user_id})
    return public_user(u)


@router.get("/stats")
async def stats(admin: dict = AdminDep):
    total_users = await users.count_documents({})
    active_users = await users.count_documents({"active": {"$ne": False}})
    total_devices = await devices.count_documents({})
    return {
        "totalUsers": total_users,
        "activeUsers": active_users,
        "totalDevices": total_devices,
    }
