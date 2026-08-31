"""Device registration — /api/v1/devices."""
from fastapi import APIRouter, Depends

from .. import audit
from ..db import devices
from ..schemas import DeviceIn
from ..security import current_user, now

router = APIRouter(prefix="/api/v1/devices", tags=["devices"])


@router.post("")
async def register_device(body: DeviceIn, u: dict = Depends(current_user)):
    await devices.update_one(
        {"user_id": u["_id"], "device_id": body.deviceId},
        {
            "$set": {
                "device_name": body.deviceName,
                "platform": body.platform,
                "app_version": body.appVersion,
                "runtime_version": body.runtimeVersion,
                "last_seen_at": now(),
            },
            "$setOnInsert": {"user_id": u["_id"], "device_id": body.deviceId, "created_at": now()},
        },
        upsert=True,
    )
    await audit.log_event(audit.DEVICE_REGISTERED, user_id=u["_id"], device_id=body.deviceId)
    return {"ok": True}


@router.get("")
async def list_devices(u: dict = Depends(current_user)):
    rows = await devices.find({"user_id": u["_id"]}).to_list(200)
    return [
        {
            "deviceId": r["device_id"],
            "deviceName": r.get("device_name"),
            "platform": r.get("platform"),
            "appVersion": r.get("app_version"),
            "lastSeenAt": (r.get("last_seen_at") or now()).isoformat(),
        }
        for r in rows
    ]
