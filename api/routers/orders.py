from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from api import deps

router = APIRouter(tags=["orders"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PrintItemIn(BaseModel):
    id:                         Optional[str]   = None
    name:                       str             = ""
    estimated_weight_grams:     float           = 0.0
    actual_weight_grams:        float           = 0.0
    estimated_time_minutes:     int             = 0
    actual_time_minutes:        int             = 0
    filament_type:              str             = "PLA+"
    color:                      str             = "Black"
    spool_id:                   str             = ""
    quantity:                   int             = 1
    rate_per_gram:              float           = 4.0
    notes:                      str             = ""
    printer_id:                 str             = ""
    infill_density:             int             = 20
    support_type:               str             = "None"


class OrderIn(BaseModel):
    customer_name:          str             = ""
    customer_phone:         str             = ""
    status:                 str             = "Draft"
    items:                  List[PrintItemIn] = []
    payment_method:         str             = "Cash"
    shipping_cost:          float           = 0.0
    order_discount_percent: float           = 0.0
    amount_received:        float           = 0.0
    notes:                  str             = ""
    is_rd_project:          bool            = False


class StatusIn(BaseModel):
    status: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _order_dict(order) -> dict:
    d = order.to_dict()
    d["items"] = [i.to_dict() for i in order.items]
    return d


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/orders")
def list_orders(
    status: Optional[str] = None,
    search: Optional[str] = None,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_order_service()
    if search:
        orders = svc.search_orders(query=search, status_filter=status)
    elif status:
        orders = svc.search_orders(status_filter=status)
    else:
        orders = svc.get_all_orders()
    return [_order_dict(o) for o in orders]


@router.post("/orders")
def create_order(
    body: OrderIn,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_order_service()
    customer_svc = deps.get_customer_service()

    customer = customer_svc.find_or_create(body.customer_name, body.customer_phone)

    order = svc.create_order(
        customer_name=customer.name,
        customer_phone=customer.phone,
        customer_id=customer.id,
    )
    order.status                 = body.status
    order.payment_method         = body.payment_method
    order.shipping_cost          = body.shipping_cost
    order.order_discount_percent = body.order_discount_percent
    order.amount_received        = body.amount_received
    order.notes                  = body.notes
    order.is_rd_project          = body.is_rd_project

    for item_data in body.items:
        svc.add_item(order, item_data.model_dump())

    svc.save_order(order)
    return _order_dict(order)


@router.get("/orders/{order_id}")
def get_order(
    order_id: str,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_order_service()
    order = svc.get_order(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return _order_dict(order)


@router.put("/orders/{order_id}")
def update_order(
    order_id: str,
    body: OrderIn,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_order_service()
    customer_svc = deps.get_customer_service()

    order = svc.get_order(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    customer = customer_svc.find_or_create(body.customer_name, body.customer_phone)
    order.customer_id            = customer.id
    order.customer_name          = customer.name
    order.customer_phone         = customer.phone
    order.status                 = body.status
    order.payment_method         = body.payment_method
    order.shipping_cost          = body.shipping_cost
    order.order_discount_percent = body.order_discount_percent
    order.amount_received        = body.amount_received
    order.notes                  = body.notes
    order.is_rd_project          = body.is_rd_project

    # Replace items
    order.items = []
    for item_data in body.items:
        svc.add_item(order, item_data.model_dump())

    svc.save_order(order)
    return _order_dict(order)


@router.patch("/orders/{order_id}/status")
def update_status(
    order_id: str,
    body: StatusIn,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_order_service()
    ok = svc.update_status(order_id, body.status)
    if not ok:
        raise HTTPException(status_code=400, detail="Status update failed")
    order = svc.get_order(order_id)
    return _order_dict(order)


@router.delete("/orders/{order_id}")
def delete_order(
    order_id: str,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_order_service()
    ok = svc.delete_order(order_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Delete failed")
    return {"ok": True}


@router.get("/orders/{order_id}/pdf/quote")
def download_quote(
    order_id: str,
    _user=Depends(deps.get_current_user),
):
    order_svc = deps.get_order_service()
    pdf_svc   = deps.get_pdf_service()
    order = order_svc.get_order(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        path = pdf_svc.generate_quote(order)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=f"quote_{order.order_number}.pdf",
    )


@router.get("/orders/{order_id}/pdf/receipt")
def download_receipt(
    order_id: str,
    _user=Depends(deps.get_current_user),
):
    order_svc = deps.get_order_service()
    pdf_svc   = deps.get_pdf_service()
    order = order_svc.get_order(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    try:
        path = pdf_svc.generate_receipt(order)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=f"receipt_{order.order_number}.pdf",
    )
