from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from api import deps

router = APIRouter(tags=["expenses"])


class ExpenseIn(BaseModel):
    date:        str   = ""
    category:    str   = "Other"
    name:        str   = ""
    description: str   = ""
    amount:      float = 0.0
    quantity:    int   = 1
    supplier:    str   = ""


@router.get("/expenses")
def list_expenses(
    category: Optional[str] = None,
    month: Optional[str]    = None,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_finance_service()
    expenses = svc.get_all_expenses(category_filter=category, month_filter=month)
    return [e.to_dict() for e in expenses]


@router.get("/expenses/stats")
def expense_stats(_user=Depends(deps.get_current_user)):
    return deps.get_finance_service().get_expense_stats()


@router.post("/expenses")
def add_expense(body: ExpenseIn, _user=Depends(deps.get_current_user)):
    svc = deps.get_finance_service()
    expense = svc.add_expense(
        category=body.category,
        name=body.name,
        amount=body.amount,
        quantity=body.quantity,
        supplier=body.supplier,
        description=body.description,
        date=body.date,
    )
    return expense.to_dict()


@router.put("/expenses/{expense_id}")
def update_expense(
    expense_id: str,
    body: ExpenseIn,
    _user=Depends(deps.get_current_user),
):
    svc = deps.get_finance_service()
    ok = svc.update_expense(expense_id, **body.model_dump())
    if not ok:
        raise HTTPException(status_code=400, detail="Update failed")
    expenses = svc.get_all_expenses()
    expense = next((e for e in expenses if e.id == expense_id), None)
    return expense.to_dict() if expense else {"ok": True}


@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: str, _user=Depends(deps.get_current_user)):
    ok = deps.get_finance_service().delete_expense(expense_id)
    if not ok:
        raise HTTPException(status_code=400, detail="Delete failed")
    return {"ok": True}
