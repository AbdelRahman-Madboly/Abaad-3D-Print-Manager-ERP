from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api import deps
from src.core.config import (
    DEFAULT_PRINTER_LIFETIME_KG,
    DEFAULT_PRINTER_PRICE,
    ELECTRICITY_RATE,
    NOZZLE_COST,
    NOZZLE_LIFETIME_GRAMS,
)

router = APIRouter(tags=["printers"])


class PrinterIn(BaseModel):
    name:                      str   = ""
    model:                     str   = ""
    purchase_price:            float = DEFAULT_PRINTER_PRICE
    lifetime_kg:               float = float(DEFAULT_PRINTER_LIFETIME_KG)
    nozzle_cost:               float = NOZZLE_COST
    nozzle_lifetime_grams:     float = NOZZLE_LIFETIME_GRAMS
    electricity_rate_per_hour: float = ELECTRICITY_RATE
    notes:                     str   = ""


def _printer_out(printer) -> dict:
    d = printer.to_dict()
    d["depreciation_per_gram"] = printer.depreciation_per_gram
    d["nozzle_usage_percent"]  = printer.nozzle_usage_percent
    return d


@router.get("/printers")
def list_printers(_user=Depends(deps.get_current_user)):
    return [_printer_out(p) for p in deps.get_printer_service().get_all_printers()]


@router.post("/printers")
def add_printer(body: PrinterIn, _user=Depends(deps.get_current_user)):
    svc = deps.get_printer_service()
    printer = svc.add_printer(
        name=body.name,
        model=body.model,
        purchase_price=body.purchase_price,
        lifetime_kg=body.lifetime_kg,
        nozzle_cost=body.nozzle_cost,
        nozzle_lifetime_grams=body.nozzle_lifetime_grams,
        electricity_rate_per_hour=body.electricity_rate_per_hour,
        notes=body.notes,
    )
    return _printer_out(printer)


@router.get("/printers/{printer_id}")
def get_printer(printer_id: str, _user=Depends(deps.get_current_user)):
    svc = deps.get_printer_service()
    printer = svc.get_printer(printer_id)
    if printer is None:
        raise HTTPException(status_code=404, detail="Printer not found")
    return _printer_out(printer)


@router.put("/printers/{printer_id}")
def update_printer(
    printer_id: str,
    body: PrinterIn,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_printer_service()
    ok = svc.update_printer(printer_id, **body.model_dump())
    if not ok:
        raise HTTPException(status_code=400, detail="Update failed")
    return _printer_out(svc.get_printer(printer_id))


@router.post("/printers/{printer_id}/reset-nozzle")
def reset_nozzle(printer_id: str, _user=Depends(deps.get_current_user)):
    svc = deps.get_printer_service()
    ok = svc.reset_nozzle(printer_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Reset failed")
    return _printer_out(svc.get_printer(printer_id))


@router.get("/printers/{printer_id}/stats")
def printer_stats(printer_id: str, _user=Depends(deps.get_current_user)):
    svc = deps.get_printer_service()
    stats = svc.get_printer_stats(printer_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Printer not found")
    return stats
