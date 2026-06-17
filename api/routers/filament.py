from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api import deps
from src.core.config import SPOOL_PRICE_FIXED

router = APIRouter(tags=["filament"])


class SpoolIn(BaseModel):
    name:                 str   = ""
    filament_type:        str   = "PLA+"
    brand:                str   = "eSUN"
    color:                str   = "Black"
    category:             str   = "standard"
    initial_weight_grams: float = 1000.0
    purchase_price_egp:   float = SPOOL_PRICE_FIXED
    notes:                str   = ""


class ColorIn(BaseModel):
    color: str


def _spool_out(spool) -> dict:
    d = spool.to_dict()
    d["available_weight_grams"] = spool.available_weight_grams
    d["remaining_percent"]      = spool.remaining_percent
    d["cost_per_gram"]          = spool.cost_per_gram
    return d


@router.get("/filament")
def list_spools(
    status: Optional[str] = None,
    search: Optional[str] = None,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_inventory_service()
    spools = svc.get_active_spools() if status == "active" else svc.get_all_spools()
    if search:
        q = search.lower()
        spools = [
            s for s in spools
            if q in s.color.lower() or q in s.brand.lower()
            or q in s.filament_type.lower() or q in (s.name or "").lower()
        ]
    return [_spool_out(s) for s in spools]


@router.get("/filament/summary")
def inventory_summary(_user=Depends(deps.get_current_user)):
    return deps.get_inventory_service().get_inventory_summary()


@router.get("/filament/colors")
def list_colors(_user=Depends(deps.get_current_user)):
    return deps.get_inventory_service().get_colors()


@router.post("/filament/colors")
def add_color(body: ColorIn, _user=Depends(deps.get_current_user)):
    ok = deps.get_inventory_service().add_color(body.color)
    if not ok:
        raise HTTPException(status_code=400, detail="Color already exists or invalid")
    return {"ok": True}


@router.post("/filament")
def add_spool(body: SpoolIn, _user=Depends(deps.get_current_user)):
    svc = deps.get_inventory_service()
    spool = svc.add_spool(
        color=body.color,
        filament_type=body.filament_type,
        brand=body.brand,
        name=body.name,
        category=body.category,
        initial_weight_grams=body.initial_weight_grams,
        purchase_price_egp=body.purchase_price_egp,
        notes=body.notes,
    )
    return _spool_out(spool)


@router.put("/filament/{spool_id}")
def update_spool(
    spool_id: str,
    body: SpoolIn,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_inventory_service()
    ok = svc.update_spool(spool_id, **body.model_dump())
    if not ok:
        raise HTTPException(status_code=400, detail="Update failed")
    return _spool_out(svc.get_spool(spool_id))


@router.delete("/filament/{spool_id}")
def delete_spool(spool_id: str, _user=Depends(deps.get_current_user)):
    ok = deps.get_inventory_service().delete_spool(spool_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Delete failed")
    return {"ok": True}


@router.post("/filament/{spool_id}/trash")
def trash_spool(spool_id: str, _user=Depends(deps.get_current_user)):
    ok = deps.get_inventory_service().move_to_trash(spool_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Trash operation failed")
    return {"ok": True}
