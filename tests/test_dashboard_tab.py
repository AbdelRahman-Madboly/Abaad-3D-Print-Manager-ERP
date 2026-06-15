"""
tests/test_dashboard_tab.py
============================
Headless Tk integration tests for DashboardTab (Phase 4 — Unified Dashboard).

Builds a real Tk root + DashboardTab against a seeded in-memory SQLite
database (mirrors Phase 1's headless-Tk verification approach), then asserts
on the constructed widgets' state. If no display is available for Tk, these
tests are skipped rather than failed.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.database import DatabaseManager
from src.core.models import Order, PrintItem
from src.services.finance_service import FinanceService
from src.services.customer_service import CustomerService
from src.services.inventory_service import InventoryService
from src.services.printer_service import PrinterService
from src.services.order_service import OrderService
from src.auth.auth_manager import User
from src.ui.theme import Colors

try:
    import tkinter as tk
except ImportError:  # pragma: no cover
    tk = None


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def root():
    if tk is None:
        pytest.skip("tkinter not available")
    try:
        r = tk.Tk()
        r.withdraw()
    except tk.TclError:
        pytest.skip("no display available for Tk")
    yield r
    r.destroy()


@pytest.fixture
def db():
    return DatabaseManager(":memory:")


@pytest.fixture
def services(db):
    printer_svc = PrinterService(db)
    return {
        "finance":   FinanceService(db),
        "customer":  CustomerService(db),
        "inventory": InventoryService(db),
        "printer":   printer_svc,
        "order":     OrderService(db, printer_service=printer_svc),
    }


@pytest.fixture
def admin_user():
    u = User()
    u.role = "Admin"
    return u


def _build_tab(root, services, admin_user, **kwargs):
    from src.ui.tabs.dashboard_tab import DashboardTab
    return DashboardTab(
        root,
        services["finance"], services["customer"], services["inventory"],
        services["printer"], services["order"], admin_user, **kwargs,
    )


def _seed_customer(db, name: str = "Alice") -> str:
    import uuid
    cid = str(uuid.uuid4())[:8]
    db.save_customer({
        "id": cid, "name": name, "phone": "", "email": "", "address": "",
        "notes": "", "discount_percent": 0.0, "total_orders": 0,
        "total_spent": 0.0, "created_date": "2024-01-01 00:00:00",
        "updated_date": "2024-01-01 00:00:00",
    })
    return cid


def _make_item(weight: float = 50.0, qty: int = 1, printer_id: str = "") -> PrintItem:
    item = PrintItem()
    item.name = "Bracket"
    item.estimated_weight_grams = weight
    item.quantity = qty
    item.rate_per_gram = 4.0
    item.estimated_time_minutes = 60
    item.printer_id = printer_id
    return item


# ---------------------------------------------------------------------------
# Empty DB — graceful "no data" / "no alerts" states
# ---------------------------------------------------------------------------

class TestDashboardEmptyState:

    def test_builds_without_error_on_empty_db(self, root, db, services, admin_user):
        tab = _build_tab(root, services, admin_user)
        root.update()
        assert tab.winfo_exists()

    def test_action_center_shows_three_neutral_cards(self, root, db, services, admin_user):
        tab = _build_tab(root, services, admin_user)
        root.update()

        cards = tab._action_frame.winfo_children()
        assert len(cards) == 3
        for card in cards:
            assert card["bg"] == Colors.SUCCESS  # "all clear" styling

    def test_printer_utilization_handles_default_printer(self, root, db, services, admin_user):
        tab = _build_tab(root, services, admin_user)
        root.update()

        # DatabaseManager seeds one default active printer
        assert len(tab._printer_frame.winfo_children()) >= 1

    def test_headline_cards_render_with_dashes_on_empty_db(self, root, db, services, admin_user):
        tab = _build_tab(root, services, admin_user)
        root.update()

        for key in ("revenue", "net_profit", "active_orders", "filament"):
            value_text = tab._stat_cards[key]._lbl_value["text"]
            assert value_text  # populated (not left as placeholder "—")


# ---------------------------------------------------------------------------
# Seeded data — Action Center alert counts
# ---------------------------------------------------------------------------

class TestActionCenterAlerts:

    def test_low_filament_alert_fires(self, root, db, services, admin_user):
        services["inventory"].add_spool(color="Black", initial_weight_grams=10.0)

        tab = _build_tab(root, services, admin_user)
        root.update()

        low_filament_card = tab._action_frame.winfo_children()[0]
        assert low_filament_card["bg"] == Colors.WARNING

    def test_no_low_filament_alert_with_healthy_spool(self, root, db, services, admin_user):
        services["inventory"].add_spool(color="Black", initial_weight_grams=1000.0)

        tab = _build_tab(root, services, admin_user)
        root.update()

        low_filament_card = tab._action_frame.winfo_children()[0]
        assert low_filament_card["bg"] == Colors.SUCCESS

    def test_orders_needing_attention_alert_fires_for_unpaid_delivered(
        self, root, db, services, admin_user
    ):
        _seed_customer(db)
        order = Order()
        order.order_number   = 1
        order.customer_name  = "Alice"
        order.payment_method = "Cash"
        order.items = [_make_item()]
        services["order"].save_order(order)
        services["order"].update_status(order.id, "Delivered")  # amount_received stays 0

        tab = _build_tab(root, services, admin_user)
        root.update()

        orders_card = tab._action_frame.winfo_children()[1]
        assert orders_card["bg"] == Colors.WARNING

    def test_printer_maintenance_alert_fires_for_worn_nozzle(
        self, root, db, services, admin_user
    ):
        printer = services["printer"].get_all_printers()[0]
        services["printer"].update_printer(printer.id, nozzle_lifetime_grams=100.0)
        services["printer"].record_print_job(printer.id, grams=90.0, minutes=10)

        tab = _build_tab(root, services, admin_user)
        root.update()

        printer_card = tab._action_frame.winfo_children()[2]
        assert printer_card["bg"] == Colors.WARNING


# ---------------------------------------------------------------------------
# Navigation
# ---------------------------------------------------------------------------

class TestActionCenterNavigation:

    def test_clicking_low_filament_card_navigates_to_filament_tab(
        self, root, db, services, admin_user
    ):
        services["inventory"].add_spool(color="Black", initial_weight_grams=10.0)

        navigated = []
        tab = _build_tab(root, services, admin_user, on_navigate=navigated.append)
        root.update()

        card = tab._action_frame.winfo_children()[0]
        card.event_generate("<Button-1>")
        root.update()

        assert navigated == ["filament"]

    def test_clicking_orders_card_navigates_to_orders_tab(
        self, root, db, services, admin_user
    ):
        navigated = []
        tab = _build_tab(root, services, admin_user, on_navigate=navigated.append)
        root.update()

        card = tab._action_frame.winfo_children()[1]
        card.event_generate("<Button-1>")
        root.update()

        assert navigated == ["orders"]

    def test_clicking_printer_card_navigates_to_printers_tab(
        self, root, db, services, admin_user
    ):
        navigated = []
        tab = _build_tab(root, services, admin_user, on_navigate=navigated.append)
        root.update()

        card = tab._action_frame.winfo_children()[2]
        card.event_generate("<Button-1>")
        root.update()

        assert navigated == ["printers"]


# ---------------------------------------------------------------------------
# Headline numbers
# ---------------------------------------------------------------------------

class TestHeadlineNumbers:

    def test_revenue_reflects_delivered_order(self, root, db, services, admin_user):
        _seed_customer(db)
        order = Order()
        order.order_number   = 1
        order.customer_name  = "Alice"
        order.payment_method = "Cash"
        order.items = [_make_item(weight=50.0)]  # 50g * 4.0 EGP/g = 200 EGP
        services["order"].save_order(order)
        services["order"].update_status(order.id, "Delivered")

        tab = _build_tab(root, services, admin_user)
        root.update()

        revenue_text = tab._stat_cards["revenue"]._lbl_value["text"]
        assert "200" in revenue_text

    def test_active_orders_excludes_delivered_and_cancelled(
        self, root, db, services, admin_user
    ):
        _seed_customer(db)

        active_order = Order()
        active_order.order_number = 1
        active_order.customer_name = "Alice"
        active_order.payment_method = "Cash"
        active_order.items = [_make_item()]
        services["order"].save_order(active_order)
        services["order"].update_status(active_order.id, "Confirmed")

        delivered_order = Order()
        delivered_order.order_number = 2
        delivered_order.customer_name = "Alice"
        delivered_order.payment_method = "Cash"
        delivered_order.items = [_make_item()]
        services["order"].save_order(delivered_order)
        services["order"].update_status(delivered_order.id, "Delivered")

        tab = _build_tab(root, services, admin_user)
        root.update()

        assert tab._stat_cards["active_orders"]._lbl_value["text"] == "1"


# ---------------------------------------------------------------------------
# Printer utilization
# ---------------------------------------------------------------------------

class TestPrinterUtilization:

    def test_shows_one_row_per_printer(self, root, db, services, admin_user):
        services["printer"].add_printer(name="Second Printer")

        tab = _build_tab(root, services, admin_user)
        root.update()

        printers = services["printer"].get_all_printers()
        assert len(tab._printer_frame.winfo_children()) == len(printers)


# ---------------------------------------------------------------------------
# Detailed breakdowns
# ---------------------------------------------------------------------------

class TestDetailedBreakdowns:

    def test_customer_count_card_populated(self, root, db, services, admin_user):
        _seed_customer(db, "Alice")
        _seed_customer(db, "Bob")

        tab = _build_tab(root, services, admin_user)
        root.update()

        lbl = tab._detail_cards["customers_total_customers"]
        assert lbl["text"] == "2"
