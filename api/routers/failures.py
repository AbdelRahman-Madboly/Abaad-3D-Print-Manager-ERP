from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api import deps

router = APIRouter(tags=["failures"])


class FailureIn(BaseModel):
    date:                  str   = ""
    source:                str   = "Manual"
    order_id:              str   = ""
    item_name:             str   = ""
    reason:                str   = "Other"
    description:           str   = ""
    filament_wasted_grams: float = 0.0
    time_wasted_minutes:   int   = 0
    spool_id:              str   = ""
    color:                 str   = ""
    printer_id:            str   = ""
    printer_name:          str   = ""


@router.get("/failures")
def list_failures(
    reason: Optional[str] = None,
    source: Optional[str] = None,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_finance_service()
    failures = svc.get_all_failures(reason_filter=reason, source_filter=source)
    return [f.to_dict() for f in failures]


@router.get("/failures/stats")
def failure_stats(_user=Depends(deps.get_current_user)):
    return deps.get_finance_service().get_failure_stats()


@router.post("/failures")
def log_failure(body: FailureIn, _user=Depends(deps.get_current_user)):
    svc = deps.get_finance_service()
    failure = svc.log_failure(
        source=body.source,
        item_name=body.item_name,
        reason=body.reason,
        filament_wasted_grams=body.filament_wasted_grams,
        time_wasted_minutes=body.time_wasted_minutes,
        spool_id=body.spool_id,
        color=body.color,
        printer_id=body.printer_id,
        printer_name=body.printer_name,
        order_id=body.order_id,
        description=body.description,
        date=body.date,
    )
    return failure.to_dict()


@router.delete("/failures/{failure_id}")
def delete_failure(failure_id: str, _user=Depends(deps.get_current_user)):
    ok = deps.get_finance_service().delete_failure(failure_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Delete failed")
    return {"ok": True}
