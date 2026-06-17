from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api import deps

router = APIRouter(tags=["customers"])


class CustomerIn(BaseModel):
    name:             str   = ""
    phone:            str   = ""
    email:            str   = ""
    address:          str   = ""
    notes:            str   = ""
    discount_percent: float = 0.0


@router.get("/customers")
def list_customers(
    search: Optional[str] = None,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_customer_service()
    customers = svc.search(search) if search else svc.get_all_customers()
    return [c.to_dict() for c in customers]


@router.post("/customers")
def create_customer(
    body: CustomerIn,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_customer_service()
    customer = svc.create_customer(
        name=body.name,
        phone=body.phone,
        email=body.email,
        address=body.address,
        notes=body.notes,
        discount_percent=body.discount_percent,
    )
    return customer.to_dict()


@router.get("/customers/{customer_id}")
def get_customer(
    customer_id: str,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_customer_service()
    customer = svc.get_customer(customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer.to_dict()


@router.put("/customers/{customer_id}")
def update_customer(
    customer_id: str,
    body: CustomerIn,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_customer_service()
    ok = svc.update_customer(customer_id, **body.model_dump())
    if not ok:
        raise HTTPException(status_code=400, detail="Update failed")
    return svc.get_customer(customer_id).to_dict()


@router.delete("/customers/{customer_id}")
def delete_customer(
    customer_id: str,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_customer_service()
    ok = svc.delete_customer(customer_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Delete failed")
    return {"ok": True}


@router.get("/customers/{customer_id}/orders")
def customer_orders(
    customer_id: str,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_customer_service()
    orders = svc.get_customer_orders(customer_id)
    return [o.to_dict() for o in orders]
