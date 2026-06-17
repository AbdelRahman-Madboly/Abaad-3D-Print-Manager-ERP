from fastapi import APIRouter, Depends
from pydantic import BaseModel

from api import deps

router = APIRouter(tags=["settings"])


class SettingsPatch(BaseModel):
    # Accept any key/value pairs for settings
    model_config = {"extra": "allow"}


@router.get("/settings")
def get_settings(_user=Depends(deps.get_current_user)):
    db = deps.get_db()
    return db.get_all_settings()


@router.post("/settings")
def save_settings(
    body: dict,
    _user=Depends(deps.get_current_user),
):
    db = deps.get_db()
    for key, value in body.items():
        db.save_setting(key, str(value))
    return db.get_all_settings()
