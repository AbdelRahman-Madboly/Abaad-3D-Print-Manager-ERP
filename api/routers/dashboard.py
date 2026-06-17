from fastapi import APIRouter, Depends

from api import deps

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/summary")
def dashboard_summary(
    period: str = "month",
    _user=Depends(deps.get_current_user),
):
    finance_svc   = deps.get_finance_service()
    order_svc     = deps.get_order_service()
    inventory_svc = deps.get_inventory_service()
    printer_svc   = deps.get_printer_service()

    # Core aggregates
    stats        = finance_svc.get_full_statistics()      # dict
    order_stats  = finance_svc.get_order_stats()
    fail_stats   = finance_svc.get_failure_stats()
    exp_stats    = finance_svc.get_expense_stats()
    inv_summary  = inventory_svc.get_inventory_summary()

    revenue      = stats.get("total_revenue", 0)
    gross_profit = stats.get("gross_profit", 0)
    profit_margin = round((gross_profit / revenue * 100), 1) if revenue > 0 else 0

    # Action-center alerts
    attention     = order_svc.get_orders_needing_attention()
    overdue       = [o.to_dict() for o in attention.get("overdue", [])]
    unpaid        = [o.to_dict() for o in attention.get("unpaid", [])]
    nozzle_alerts = [p.to_dict() for p in printer_svc.get_printers_needing_maintenance()]

    return {
        "period": period,
        "kpi": {
            "revenue":        revenue,
            "gross_profit":   gross_profit,
            "profit_margin":  profit_margin,
            "total_orders":   order_stats.get("total", 0),
            "active_spools":  inv_summary.get("active_spools", 0),
            "total_expenses": exp_stats.get("total_expenses", 0),
            "failure_cost":   fail_stats.get("total_cost", 0),
        },
        "alerts": {
            "overdue_orders":     overdue,
            "unpaid_orders":      unpaid,
            "nozzle_alerts":      nozzle_alerts,
            "overdue_count":      len(overdue),
            "unpaid_count":       len(unpaid),
            "nozzle_alert_count": len(nozzle_alerts),
        },
        "charts": {
            "monthly_revenue":   finance_svc.get_monthly_revenue(),
            "order_status":      finance_svc.get_order_status_breakdown(),
            "filament_by_color": finance_svc.get_filament_usage_by_color(),
            "expenses_by_cat":   finance_svc.get_expenses_by_category(),
        },
        "inventory": inv_summary,
        "profit_report": finance_svc.get_profit_report(),
    }
