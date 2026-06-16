"""
tests/test_order_service.py
============================
Integration tests for OrderService against an in-memory SQLite database.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.database import DatabaseManager
from src.core.models import Order, PrintItem
from src.services.inventory_service import InventoryService
from src.services.order_service import OrderService

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def db():
    """Fresh in-memory SQLite database per test."""
    manager = DatabaseManager(":memory:")
    return manager


@pytest.fixture
def svc(db):
    return OrderService(db)


@pytest.fixture
def inv(db):
    return InventoryService(db)


def _seed_customer(db) -> str:
    """Insert a minimal customer and return its id."""
    import uuid
    customer_id = str(uuid.uuid4())[:8]
    db.save_customer({
        "id":               customer_id,
        "name":             "Alice",
        "phone":            "01000000000",
        "email":            "",
        "address":          "",
        "notes":            "",
        "discount_percent": 0.0,
        "total_orders":     0,
        "total_spent":      0.0,
        "created_date":     "2024-01-01 00:00:00",
        "updated_date":     "2024-01-01 00:00:00",
    })
    return customer_id


def _make_order(order_number: int = 1, customer_name: str = "Alice") -> Order:
    o = Order()
    o.order_number    = order_number
    o.customer_name   = customer_name
    o.payment_method  = "Cash"
    return o


def _make_item(weight: float = 50.0, qty: int = 1) -> PrintItem:
    item = PrintItem()
    item.name                   = "Bracket"
    item.estimated_weight_grams = weight
    item.quantity               = qty
    item.rate_per_gram          = 4.0
    item.estimated_time_minutes = 60
    return item


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestOrderService:

    def test_first_order_number_is_one(self, svc, db):
        _seed_customer(db)
        n = svc.get_next_order_number()
        assert n == 1

    def test_second_order_number_increments(self, svc, db):
        _seed_customer(db)
        svc.get_next_order_number()   # consume 1
        n = svc.get_next_order_number()
        assert n == 2

    def test_save_and_get_order(self, svc, db):
        """Saved order is retrievable with correct customer name."""
        _seed_customer(db)
        order = _make_order()
        order.items = [_make_item()]
        saved = svc.save_order(order)
        assert saved is True
        retrieved = svc.get_order(order.id)
        assert retrieved is not None
        assert retrieved.customer_name == "Alice"
        assert len(retrieved.items) == 1

    def test_update_status_to_delivered(self, svc, db):
        _seed_customer(db)
        order = _make_order()
        order.items = [_make_item()]
        svc.save_order(order)
        ok = svc.update_status(order.id, "Delivered")
        assert ok is True
        updated = svc.get_order(order.id)
        assert updated.status == "Delivered"
        assert updated.delivered_date != ""

    def test_soft_delete_hides_order(self, svc, db):
        _seed_customer(db)
        order = _make_order()
        order.items = [_make_item()]
        svc.save_order(order)
        svc.delete_order(order.id)
        visible = svc.get_all_orders(include_deleted=False)
        assert not any(o.id == order.id for o in visible)

    def test_restore_makes_order_visible(self, svc, db):
        _seed_customer(db)
        order = _make_order()
        order.items = [_make_item()]
        svc.save_order(order)
        svc.delete_order(order.id)
        svc.restore_order(order.id)
        visible = svc.get_all_orders(include_deleted=False)
        assert any(o.id == order.id for o in visible)

    def test_search_orders_by_customer_name(self, svc, db):
        _seed_customer(db)
        o1 = _make_order(1, "Alice")
        o1.items = [_make_item()]
        svc.save_order(o1)

        o2 = _make_order(2, "Bob")
        o2.items = [_make_item()]
        svc.save_order(o2)

        results = svc.search_orders("Alice")
        assert all(o.customer_name == "Alice" for o in results)
        assert not any(o.customer_name == "Bob" for o in results)

    def test_rd_mode_profit_is_zero(self, svc, db):
        _seed_customer(db)
        order = _make_order()
        order.is_rd_project = True
        order.items = [_make_item(weight=100.0)]
        order.payment_method = "Cash"
        svc.save_order(order)
        retrieved = svc.get_order(order.id)
        assert retrieved.profit == pytest.approx(0.0)

    def test_vodacash_payment_fee_on_200_egp(self, svc, db):
        """200 EGP × 0.5% = 1.00 EGP (hits the minimum)."""
        _seed_customer(db)
        order = _make_order()
        order.items = [_make_item(weight=50.0)]   # 50 × 4 = 200
        order.payment_method = "Vodafone Cash"
        svc.save_order(order)
        retrieved = svc.get_order(order.id)
        assert retrieved.payment_fee == pytest.approx(1.00)


# ---------------------------------------------------------------------------
# get_orders_needing_attention  (Phase 4 — Dashboard Action Center)
# ---------------------------------------------------------------------------

class TestGetOrdersNeedingAttention:

    def test_no_alerts_for_empty_db(self, svc, db):
        result = svc.get_orders_needing_attention()
        assert result["ready_overdue"] == []
        assert result["payment_due"] == []

    def test_ready_order_overdue(self, svc, db):
        _seed_customer(db)
        order = _make_order()
        order.items = [_make_item()]
        svc.save_order(order)
        svc.update_status(order.id, "Ready")

        # Backdate updated_date beyond ORDER_READY_ALERT_DAYS
        stale_order = svc.get_order(order.id)
        stale_order.updated_date = "2000-01-01 00:00:00"
        db.save_order(stale_order.to_dict())

        result = svc.get_orders_needing_attention()
        assert any(o.id == order.id for o in result["ready_overdue"])

    def test_ready_order_not_yet_overdue(self, svc, db):
        _seed_customer(db)
        order = _make_order()
        order.items = [_make_item()]
        svc.save_order(order)
        svc.update_status(order.id, "Ready")   # updated_date == now

        result = svc.get_orders_needing_attention()
        assert not any(o.id == order.id for o in result["ready_overdue"])

    def test_payment_due_for_delivered_unpaid_order(self, svc, db):
        _seed_customer(db)
        order = _make_order()
        order.items = [_make_item()]   # total = 200, amount_received = 0
        svc.save_order(order)
        svc.update_status(order.id, "Delivered")

        result = svc.get_orders_needing_attention()
        assert any(o.id == order.id for o in result["payment_due"])

    def test_no_payment_due_when_paid_in_full(self, svc, db):
        _seed_customer(db)
        order = _make_order()
        order.items = [_make_item()]
        svc.save_order(order)
        retrieved = svc.get_order(order.id)
        retrieved.amount_received = retrieved.total
        db.save_order(retrieved.to_dict())
        svc.update_status(order.id, "Delivered")

        result = svc.get_orders_needing_attention()
        assert not any(o.id == order.id for o in result["payment_due"])

    def test_draft_orders_excluded(self, svc, db):
        _seed_customer(db)
        order = _make_order()
        order.items = [_make_item()]
        svc.save_order(order)   # status stays "Draft"

        result = svc.get_orders_needing_attention()
        assert not any(o.id == order.id for o in result["ready_overdue"])
        assert not any(o.id == order.id for o in result["payment_due"])


# ---------------------------------------------------------------------------
# record_print_job wiring on "Ready" transition  (Phase 4 — Task 1 fix)
# ---------------------------------------------------------------------------

class TestRecordPrintJobOnReadyTransition:

    def test_ready_transition_records_print_job(self, db):
        from src.services.printer_service import PrinterService
        printer_svc = PrinterService(db)
        svc = OrderService(db, printer_service=printer_svc)

        _seed_customer(db)
        printer = printer_svc.get_all_printers()[0]  # default seeded printer

        order = _make_order()
        item = _make_item(weight=100.0, qty=1)
        item.printer_id = printer.id
        item.estimated_time_minutes = 90
        order.items = [item]
        svc.save_order(order)

        svc.update_status(order.id, "Ready")

        refreshed_printer = printer_svc.get_printer(printer.id)
        assert refreshed_printer.total_printed_grams == pytest.approx(100.0)
        assert refreshed_printer.total_print_time_minutes == 90

        refreshed_order = svc.get_order(order.id)
        assert refreshed_order.items[0].is_printed is True

    def test_ready_transition_is_idempotent(self, db):
        from src.services.printer_service import PrinterService
        printer_svc = PrinterService(db)
        svc = OrderService(db, printer_service=printer_svc)

        _seed_customer(db)
        printer = printer_svc.get_all_printers()[0]

        order = _make_order()
        item = _make_item(weight=100.0, qty=1)
        item.printer_id = printer.id
        order.items = [item]
        svc.save_order(order)

        svc.update_status(order.id, "Ready")
        svc.update_status(order.id, "Delivered")
        svc.update_status(order.id, "Ready")   # back to Ready — must not double-count

        refreshed_printer = printer_svc.get_printer(printer.id)
        assert refreshed_printer.total_printed_grams == pytest.approx(100.0)

    def test_no_printer_service_skips_recording_without_error(self, db):
        svc = OrderService(db)  # no printer_service supplied (default None)
        _seed_customer(db)

        order = _make_order()
        item = _make_item(weight=100.0, qty=1)
        item.printer_id = "printer_default"
        order.items = [item]
        svc.save_order(order)

        ok = svc.update_status(order.id, "Ready")
        assert ok is True
