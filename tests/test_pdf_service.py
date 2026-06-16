"""
tests/test_pdf_service.py
==========================
Tests for PdfService — covers _load_company() settings resolution and
the full PDF generation pipeline (quote, receipt, footer, logo fallback).
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.core.config import COMPANY, PDF_FOOTER_CREDIT
from src.core.database import DatabaseManager
from src.core.models import Order, PrintItem
from src.services.pdf_service import PdfService

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_order(company_name: str = "Acme 3D") -> Order:
    """Return a minimal order with one item, ready for PDF generation."""
    o = Order()
    o.order_number   = 42
    o.customer_name  = "Test Customer"
    o.customer_phone = "01000000000"
    o.status         = "Ready"
    o.payment_method = "Cash"

    item = PrintItem()
    item.name                   = "Test Bracket"
    item.estimated_weight_grams = 50.0
    item.quantity               = 1
    item.rate_per_gram          = 4.0
    item.estimated_time_minutes = 60
    o.items = [item]
    o.calculate_totals()
    return o


@pytest.fixture
def db():
    return DatabaseManager(":memory:")


class TestLoadCompany:

    def test_defaults_when_no_db(self):
        """db=None -> always fall back to config defaults."""
        svc = PdfService(db=None)
        company = svc._load_company()
        assert company["name"]    == COMPANY["name"]
        assert company["phone"]   == COMPANY["phone"]
        assert company["address"] == COMPANY["address"]
        assert company["deposit_pct"]   == 50
        assert company["validity_days"] == 7

    def test_defaults_when_no_settings_saved(self, db):
        """Fresh DB with no company_* settings -> config defaults."""
        svc = PdfService(db)
        company = svc._load_company()
        assert company["name"]  == COMPANY["name"]
        assert company["phone"] == COMPANY["phone"]

    def test_reads_saved_company_info(self, db):
        """Settings saved via the Settings tab should appear on PDFs."""
        db.save_all_settings({
            "company_name":        "Acme 3D Printing",
            "company_subtitle":    "Custom Prints",
            "company_phone":       "0123456789",
            "company_address":     "Cairo, Egypt",
            "company_tagline":     "Print it your way",
            "company_social":      "@acme3d",
            "quote_deposit_pct":   "40",
            "quote_validity_days": "14",
            "invoice_footer":      "See you again soon!",
        })
        svc = PdfService(db)
        company = svc._load_company()
        assert company["name"]          == "Acme 3D Printing"
        assert company["subtitle"]      == "Custom Prints"
        assert company["phone"]         == "0123456789"
        assert company["address"]       == "Cairo, Egypt"
        assert company["tagline"]       == "Print it your way"
        assert company["social"]        == "@acme3d"
        assert company["deposit_pct"]   == pytest.approx(40.0)
        assert company["validity_days"] == 14
        assert company["footer_note"]   == "See you again soon!"

    def test_partial_settings_fall_back_for_missing_keys(self, db):
        """Only some settings saved -> the rest keep config defaults."""
        db.save_setting("company_name", "Only Name Set")
        svc = PdfService(db)
        company = svc._load_company()
        assert company["name"]  == "Only Name Set"
        assert company["phone"] == COMPANY["phone"]
        assert company["deposit_pct"] == 50


# ---------------------------------------------------------------------------
# PDF generation tests (require reportlab + pypdf)
# ---------------------------------------------------------------------------

rl_required = pytest.mark.skipif(
    not PdfService.is_available(), reason="reportlab not installed"
)

try:
    import importlib.util
    _pypdf_ok = importlib.util.find_spec("pypdf") is not None
except Exception:
    _pypdf_ok = False

pypdf_required = pytest.mark.skipif(not _pypdf_ok, reason="pypdf not installed")


def _extract_pdf_text(path: str) -> str:
    """Read all text from a PDF file using pypdf."""
    import pypdf
    reader = pypdf.PdfReader(path)
    return "\n".join(page.extract_text() or "" for page in reader.pages)


@rl_required
class TestPdfGeneration:

    @pytest.fixture
    def db(self):
        d = DatabaseManager(":memory:")
        d.save_all_settings({
            "company_name":    "Acme 3D Printing",
            "company_phone":   "0123456789",
            "company_address": "Cairo, Egypt",
        })
        return d

    def test_quote_generates_without_error(self, db, tmp_path):
        """Quote generator produces a non-empty PDF bytes file."""
        svc  = PdfService(db)
        order = _make_order()
        out  = tmp_path / "quote.pdf"
        path = svc.generate_quote(order, output_path=out)
        assert Path(path).exists()
        assert Path(path).stat().st_size > 0

    def test_receipt_generates_without_error(self, db, tmp_path):
        """Receipt generator produces a non-empty PDF file."""
        svc  = PdfService(db)
        order = _make_order()
        out  = tmp_path / "receipt.pdf"
        path = svc.generate_receipt(order, output_path=out)
        assert Path(path).exists()
        assert Path(path).stat().st_size > 0

    @pypdf_required
    def test_pdf_contains_company_name(self, db, tmp_path):
        """Company name configured in settings appears in the generated PDF."""
        svc  = PdfService(db)
        order = _make_order()
        path = svc.generate_receipt(order, output_path=tmp_path / "r.pdf")
        text = _extract_pdf_text(path)
        assert "Acme 3D Printing" in text

    @pypdf_required
    def test_pdf_footer_credit(self, db, tmp_path):
        """PDF_FOOTER_CREDIT text appears in every generated PDF."""
        svc  = PdfService(db)
        order = _make_order()
        path = svc.generate_receipt(order, output_path=tmp_path / "r.pdf")
        text = _extract_pdf_text(path)
        assert PDF_FOOTER_CREDIT in text

    def test_pdf_fallback_when_no_logo(self, tmp_path):
        """PDF generation does not crash when company_logo_path is empty."""
        db = DatabaseManager(":memory:")
        db.save_setting("company_logo_path", "")
        svc  = PdfService(db)
        order = _make_order()
        out  = tmp_path / "no_logo.pdf"
        # Must not raise
        path = svc.generate_receipt(order, output_path=out)
        assert Path(path).exists()
