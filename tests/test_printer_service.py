"""
tests/test_printer_service.py
==============================
Integration tests for PrinterService against an in-memory SQLite database.

Covers basic CRUD (for consistency with the other service test files) plus
the Phase 4 additions: ``record_print_job`` usage/nozzle tracking and
``get_printers_needing_maintenance`` (Dashboard Action Center).
"""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.database import DatabaseManager
from src.services.printer_service import PrinterService
from src.core.config import NOZZLE_WEAR_ALERT_PERCENT


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def db():
    """Fresh in-memory SQLite database per test."""
    return DatabaseManager(":memory:")


@pytest.fixture
def svc(db):
    return PrinterService(db)


# ---------------------------------------------------------------------------
# Basic CRUD
# ---------------------------------------------------------------------------

class TestPrinterCRUD:

    def test_default_printer_seeded(self, svc):
        """DatabaseManager seeds one default active printer on first run."""
        printers = svc.get_all_printers()
        assert any(p.id == "printer_default" for p in printers)

    def test_add_printer(self, svc):
        printer = svc.add_printer(name="HIVE 0.2", model="Prusa MK4")
        assert printer.name == "HIVE 0.2"
        assert printer.model == "Prusa MK4"
        assert printer.is_active is True

    def test_get_printer_by_id(self, svc):
        printer = svc.add_printer(name="HIVE 0.3")
        fetched = svc.get_printer(printer.id)
        assert fetched is not None
        assert fetched.id == printer.id
        assert fetched.name == "HIVE 0.3"

    def test_get_printer_unknown_id_returns_none(self, svc):
        assert svc.get_printer("does-not-exist") is None

    def test_get_all_printers_includes_new_ones(self, svc):
        before = len(svc.get_all_printers())
        svc.add_printer(name="HIVE 0.4")
        after = svc.get_all_printers()
        assert len(after) == before + 1

    def test_update_printer(self, svc):
        printer = svc.add_printer(name="Old Name")
        ok = svc.update_printer(printer.id, name="New Name", notes="serviced")
        assert ok is True
        fetched = svc.get_printer(printer.id)
        assert fetched.name == "New Name"
        assert fetched.notes == "serviced"

    def test_update_printer_unknown_id_returns_false(self, svc):
        assert svc.update_printer("does-not-exist", name="X") is False


# ---------------------------------------------------------------------------
# record_print_job — usage & nozzle tracking
# ---------------------------------------------------------------------------

class TestRecordPrintJob:

    def test_record_print_job_updates_usage_totals(self, svc):
        printer = svc.add_printer(name="Printer A", nozzle_lifetime_grams=1000.0)
        ok = svc.record_print_job(printer.id, grams=150.0, minutes=45)
        assert ok is True

        fetched = svc.get_printer(printer.id)
        assert fetched.total_printed_grams == pytest.approx(150.0)
        assert fetched.total_print_time_minutes == 45
        assert fetched.current_nozzle_grams == pytest.approx(150.0)

    def test_record_print_job_accumulates_across_calls(self, svc):
        printer = svc.add_printer(name="Printer B", nozzle_lifetime_grams=1000.0)
        svc.record_print_job(printer.id, grams=100.0, minutes=20)
        svc.record_print_job(printer.id, grams=50.0, minutes=10)

        fetched = svc.get_printer(printer.id)
        assert fetched.total_printed_grams == pytest.approx(150.0)
        assert fetched.total_print_time_minutes == 30

    def test_nozzle_change_increments_on_overflow(self, svc):
        printer = svc.add_printer(name="Printer C", nozzle_lifetime_grams=100.0)
        svc.record_print_job(printer.id, grams=120.0, minutes=10)

        fetched = svc.get_printer(printer.id)
        assert fetched.nozzle_changes == 1
        assert fetched.current_nozzle_grams == pytest.approx(20.0)

    def test_record_print_job_unknown_printer_returns_false(self, svc):
        assert svc.record_print_job("does-not-exist", grams=10.0, minutes=5) is False

    def test_reset_nozzle(self, svc):
        printer = svc.add_printer(name="Printer D", nozzle_lifetime_grams=100.0)
        svc.record_print_job(printer.id, grams=50.0, minutes=10)
        ok = svc.reset_nozzle(printer.id)
        assert ok is True

        fetched = svc.get_printer(printer.id)
        assert fetched.current_nozzle_grams == pytest.approx(0.0)
        assert fetched.nozzle_changes == 1


# ---------------------------------------------------------------------------
# get_printer_stats
# ---------------------------------------------------------------------------

class TestGetPrinterStats:

    def test_stats_for_unknown_printer_returns_none(self, svc):
        assert svc.get_printer_stats("does-not-exist") is None

    def test_stats_reflect_recorded_usage(self, svc):
        printer = svc.add_printer(name="Printer E", nozzle_lifetime_grams=1000.0)
        svc.record_print_job(printer.id, grams=500.0, minutes=120)

        stats = svc.get_printer_stats(printer.id)
        assert stats["total_printed_grams"]  == pytest.approx(500.0)
        assert stats["total_print_time_min"] == 120
        assert stats["nozzle_usage_pct"]      == pytest.approx(50.0)
        assert stats["total_running_cost"]   > 0


# ---------------------------------------------------------------------------
# get_printers_needing_maintenance  (Phase 4 — Dashboard Action Center)
# ---------------------------------------------------------------------------

class TestGetPrintersNeedingMaintenance:

    def test_no_printers_flagged_initially(self, svc):
        assert svc.get_printers_needing_maintenance() == []

    def test_printer_at_or_above_threshold_is_flagged(self, svc):
        printer = svc.add_printer(name="Worn Printer", nozzle_lifetime_grams=100.0)
        # NOZZLE_WEAR_ALERT_PERCENT% of a 100 g nozzle lifetime
        grams = NOZZLE_WEAR_ALERT_PERCENT
        svc.record_print_job(printer.id, grams=grams, minutes=10)

        flagged_ids = [p.id for p in svc.get_printers_needing_maintenance()]
        assert printer.id in flagged_ids

    def test_printer_below_threshold_not_flagged(self, svc):
        printer = svc.add_printer(name="Fresh Printer", nozzle_lifetime_grams=1000.0)
        svc.record_print_job(printer.id, grams=10.0, minutes=5)

        flagged_ids = [p.id for p in svc.get_printers_needing_maintenance()]
        assert printer.id not in flagged_ids

    def test_inactive_printer_not_flagged_even_if_worn(self, svc):
        printer = svc.add_printer(name="Retired Printer", nozzle_lifetime_grams=100.0)
        svc.record_print_job(printer.id, grams=90.0, minutes=10)
        svc.update_printer(printer.id, is_active=False)

        flagged_ids = [p.id for p in svc.get_printers_needing_maintenance()]
        assert printer.id not in flagged_ids
