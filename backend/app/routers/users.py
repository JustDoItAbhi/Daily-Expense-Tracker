"""User self-service — /api/v1/users/me."""
from fastapi import APIRouter, Depends

from ..db import users
from ..schemas import UpdateMeIn
from ..security import current_user, now, public_user

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me")
async def get_me(u: dict = Depends(current_user)):
    return public_user(u)


@router.patch("/me")
async def update_me(body: UpdateMeIn, u: dict = Depends(current_user)):
    patch: dict = {}
    if body.fullName is not None:
        patch["full_name"] = body.fullName.strip()
    if body.currency is not None:
        patch["currency"] = body.currency
    if body.dailyLimit is not None:
        patch["daily_limit"] = body.dailyLimit
    if patch:
        patch["updated_at"] = now()
        await users.update_one({"_id": u["_id"]}, {"$set": patch})
        u = await users.find_one({"_id": u["_id"]})
    return public_user(u)
