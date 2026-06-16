"""
tests/test_finance_service.py
==============================
Tests for FinanceService analytics aggregation methods used by DashboardTab:
get_full_statistics, get_monthly_revenue, get_order_status_breakdown,
get_expenses_by_category, and get_filament_usage_by_color.
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.database import DatabaseManager
from src.core.models import Order, PrintItem
from src.services.finance_service import FinanceService
from src.services.order_service import OrderService
from src.services.printer_service import PrinterService

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def db():
    return DatabaseManager(":memory:")


@pytest.fixture
def fin(db):
    return FinanceService(db)


@pytest.fixture
def order_svc(db):
    return OrderService(db)


@pytest.fixture
def printer_svc(db):
    return PrinterService(db)


def _seed_customer(db, name="Alice") -> str:
    import uuid
    cid = str(uuid.uuid4())[:8]
    db.save_customer({
        "id": cid, "name": name, "phone": "", "email": "", "address": "",
        "notes": "", "discount_percent": 0.0, "total_orders": 0,
        "total_spent": 0.0, "created_date": "2024-01-01 00:00:00",
        "updated_date": "2024-01-01 00:00:00",
    })
    return cid


def _make_order(order_svc, customer, created_date, status, items):
    """Create an order, add items, then override created_date/status."""
    order = order_svc.create_order(customer_name=customer)
    for item_data in items:
        order_svc.add_item(order, item_data)
    order.created_date = created_date
    order.status = status
    order_svc.save_order(order)
    return order


# ---------------------------------------------------------------------------
# get_monthly_revenue
# ---------------------------------------------------------------------------

class TestGetMonthlyRevenue:

    def test_buckets_by_month_and_excludes_cancelled(self, fin, order_svc):
        _make_order(order_svc, "Alice", "2024-01-15 10:00:00", "Delivered", [
            {"name": "Part A", "estimated_weight_grams": 50, "quantity": 2,
             "rate_per_gram": 4.0, "color": "Black"},
        ])
        _make_order(order_svc, "Bob", "2024-01-20 10:00:00", "Confirmed", [
            {"name": "Part B", "estimated_weight_grams": 30, "quantity": 1,
             "rate_per_gram": 4.0, "color": "Red"},
        ])
        _make_order(order_svc, "Eve", "2024-01-25 10:00:00", "Cancelled", [
            {"name": "Part C", "estimated_weight_grams": 100, "quantity": 1,
             "rate_per_gram": 4.0, "color": "White"},
        ])

        result = fin.get_monthly_revenue("2024-01-01", "2024-01-31")
        assert len(result) == 1
        jan = result[0]
        assert jan["month"] == "2024-01"
        # Revenue = (50*2*4.0) + (30*1*4.0) = 400 + 120 = 520 (Cancelled excluded)
        assert jan["revenue"] == pytest.approx(520.0)
        assert "costs" in jan
        assert "profit" in jan

    def test_date_range_filtering(self, fin, order_svc):
        _make_order(order_svc, "Alice", "2024-01-15 10:00:00", "Delivered", [
            {"name": "Part A", "estimated_weight_grams": 50, "quantity": 1,
             "rate_per_gram": 4.0, "color": "Black"},
        ])
        _make_order(order_svc, "Bob", "2024-03-15 10:00:00", "Delivered", [
            {"name": "Part B", "estimated_weight_grams": 50, "quantity": 1,
             "rate_per_gram": 4.0, "color": "Red"},
        ])

        result = fin.get_monthly_revenue("2024-01-01", "2024-01-31")
        months = [r["month"] for r in result]
        assert months == ["2024-01"]

    def test_empty_db_returns_empty_list(self, fin):
        assert fin.get_monthly_revenue("2024-01-01", "2024-12-31") == []


# ---------------------------------------------------------------------------
# get_order_status_breakdown
# ---------------------------------------------------------------------------

class TestGetOrderStatusBreakdown:

    def test_counts_by_status(self, fin, order_svc):
        _make_order(order_svc, "Alice", "2024-01-15 10:00:00", "Delivered", [])
        _make_order(order_svc, "Bob",   "2024-01-16 10:00:00", "Delivered", [])
        _make_order(order_svc, "Eve",   "2024-01-17 10:00:00", "Confirmed", [])

        result = fin.get_order_status_breakdown("2024-01-01", "2024-01-31")
        as_dict = {r["status"]: r["count"] for r in result}
        assert as_dict["Delivered"] == 2
        assert as_dict["Confirmed"] == 1

    def test_date_range_filtering(self, fin, order_svc):
        _make_order(order_svc, "Alice", "2024-01-15 10:00:00", "Delivered", [])
        _make_order(order_svc, "Bob",   "2024-03-15 10:00:00", "Delivered", [])

        result = fin.get_order_status_breakdown("2024-01-01", "2024-01-31")
        as_dict = {r["status"]: r["count"] for r in result}
        assert as_dict["Delivered"] == 1

    def test_empty_db_returns_empty_list(self, fin):
        assert fin.get_order_status_breakdown("2024-01-01", "2024-12-31") == []


# ---------------------------------------------------------------------------
# get_expenses_by_category
# ---------------------------------------------------------------------------

class TestGetExpensesByCategory:

    def test_totals_by_category(self, fin):
        fin.add_expense(category="Tools", name="Pliers",
                         amount=100.0, date="2024-01-05")
        fin.add_expense(category="Tools", name="Screwdriver",
                         amount=50.0, date="2024-01-10")
        fin.add_expense(category="Filament", name="PLA spool",
                         amount=840.0, date="2024-01-12")
        fin.add_expense(category="Bills", name="Electricity",
                         amount=200.0, date="2024-02-01")

        result = fin.get_expenses_by_category("2024-01-01", "2024-01-31")
        as_dict = {r["category"]: r["total"] for r in result}
        assert as_dict["Tools"] == pytest.approx(150.0)
        assert as_dict["Filament"] == pytest.approx(840.0)
        assert "Bills" not in as_dict  # outside the date range

    def test_empty_db_returns_empty_list(self, fin):
        assert fin.get_expenses_by_category("2024-01-01", "2024-12-31") == []


# ---------------------------------------------------------------------------
# get_filament_usage_by_color
# ---------------------------------------------------------------------------

class TestGetFilamentUsageByColor:

    def test_sums_weight_by_color(self, fin, order_svc):
        _make_order(order_svc, "Alice", "2024-01-15 10:00:00", "Delivered", [
            {"name": "Part A", "estimated_weight_grams": 50, "quantity": 2,
             "rate_per_gram": 4.0, "color": "Black"},
            {"name": "Part B", "estimated_weight_grams": 20, "quantity": 1,
             "rate_per_gram": 4.0, "color": "Black"},
        ])
        _make_order(order_svc, "Bob", "2024-01-20 10:00:00", "Delivered", [
            {"name": "Part C", "estimated_weight_grams": 30, "quantity": 1,
             "rate_per_gram": 4.0, "color": "Red"},
        ])

        result = fin.get_filament_usage_by_color("2024-01-01", "2024-01-31")
        as_dict = {r["color"]: r["grams"] for r in result}
        # Black: (50*2) + (20*1) = 120 ; Red: 30
        assert as_dict["Black"] == pytest.approx(120.0)
        assert as_dict["Red"] == pytest.approx(30.0)

    def test_excludes_cancelled_orders(self, fin, order_svc):
        _make_order(order_svc, "Eve", "2024-01-15 10:00:00", "Cancelled", [
            {"name": "Part D", "estimated_weight_grams": 100, "quantity": 1,
             "rate_per_gram": 4.0, "color": "White"},
        ])
        result = fin.get_filament_usage_by_color("2024-01-01", "2024-01-31")
        colors = [r["color"] for r in result]
        assert "White" not in colors

    def test_date_range_filtering(self, fin, order_svc):
        _make_order(order_svc, "Alice", "2024-01-15 10:00:00", "Delivered", [
            {"name": "Part A", "estimated_weight_grams": 50, "quantity": 1,
             "rate_per_gram": 4.0, "color": "Black"},
        ])
        _make_order(order_svc, "Bob", "2024-03-15 10:00:00", "Delivered", [
            {"name": "Part B", "estimated_weight_grams": 50, "quantity": 1,
             "rate_per_gram": 4.0, "color": "Red"},
        ])

        result = fin.get_filament_usage_by_color("2024-01-01", "2024-01-31")
        colors = [r["color"] for r in result]
        assert "Black" in colors
        assert "Red" not in colors

    def test_empty_db_returns_empty_list(self, fin):
        assert fin.get_filament_usage_by_color("2024-01-01", "2024-12-31") == []


# ---------------------------------------------------------------------------
# get_full_statistics  (Phase 3 verification — total_weight/time non-zero)
# ---------------------------------------------------------------------------

class TestGetFullStatistics:

    def test_empty_db_returns_zero_weight_and_time(self, db, fin):
        stats = fin.get_full_statistics()
        assert stats["total_weight"] == 0.0
        assert stats["total_print_time"] == 0

    def test_weight_and_time_are_non_zero_after_ready_transition(
        self, db, fin, printer_svc
    ):
        """Transitioning an order to Ready triggers record_print_job,
        which should make total_weight and total_print_time non-zero."""
        order_svc = OrderService(db, printer_service=printer_svc)
        _seed_customer(db)
        printer = printer_svc.get_all_printers()[0]

        order = Order()
        order.order_number = 1
        order.customer_name = "Alice"
        order.payment_method = "Cash"
        item = PrintItem()
        item.name = "Bracket"
        item.estimated_weight_grams = 150.0
        item.quantity = 1
        item.rate_per_gram = 4.0
        item.estimated_time_minutes = 90
        item.printer_id = printer.id
        order.items = [item]
        order_svc.save_order(order)
        order_svc.update_status(order.id, "Ready")

        stats = fin.get_full_statistics()
        assert stats["total_weight"] == pytest.approx(150.0)
        assert stats["total_print_time"] == 90

    def test_weight_accumulates_across_multiple_orders(self, db, fin, printer_svc):
        order_svc = OrderService(db, printer_service=printer_svc)
        _seed_customer(db)
        printer = printer_svc.get_all_printers()[0]

        for i, grams in enumerate([100.0, 50.0], start=1):
            order = Order()
            order.order_number = i
            order.customer_name = "Alice"
            order.payment_method = "Cash"
            item = PrintItem()
            item.name = "Part"
            item.estimated_weight_grams = grams
            item.quantity = 1
            item.rate_per_gram = 4.0
            item.estimated_time_minutes = 30
            item.printer_id = printer.id
            order.items = [item]
            order_svc.save_order(order)
            order_svc.update_status(order.id, "Ready")

        stats = fin.get_full_statistics()
        assert stats["total_weight"] == pytest.approx(150.0)
        assert stats["total_print_time"] == 60

    def test_cancelled_orders_excluded_from_weight(self, db, fin, printer_svc):
        order_svc = OrderService(db, printer_service=printer_svc)
        _seed_customer(db)
        printer = printer_svc.get_all_printers()[0]

        order = Order()
        order.order_number = 1
        order.customer_name = "Alice"
        order.payment_method = "Cash"
        item = PrintItem()
        item.name = "Part"
        item.estimated_weight_grams = 200.0
        item.quantity = 1
        item.rate_per_gram = 4.0
        item.estimated_time_minutes = 60
        item.printer_id = printer.id
        order.items = [item]
        order_svc.save_order(order)
        order_svc.update_status(order.id, "Cancelled")

        stats = fin.get_full_statistics()
        assert stats["total_weight"] == 0.0
