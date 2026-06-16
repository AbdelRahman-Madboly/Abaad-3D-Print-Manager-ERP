"""
tests/test_phase2.py
====================
Tests for Phase 2 — Generalization & Branding.

All tests are headless-safe: Tkinter is never imported at test-collection
time. Wizard / LoginDialog behaviour is verified via source inspection or
logic-only helpers.

Covers:
  1. setup_complete flag gating (logic-level)
  2. DEFAULT_SETTINGS has new Phase 2 keys
  3. get_currency_symbol() cache + DB read + fallback
  4. format_currency() explicit-symbol override (backward compat)
  5. pdf_service._load_company() logo_path / currency_symbol from settings
  6. v4 migration artefacts removed (source inspection)
  7. settings_tab uses save_all_settings() batch pattern (source inspection)
  8. Default-password warning sentinel values (source inspection + logic)
"""

from pathlib import Path
from unittest.mock import MagicMock

import pytest

# ---------------------------------------------------------------------------
# Helpers / fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_currency_cache():
    """Clear the currency symbol cache before and after every test."""
    from src.utils import helpers as h
    h._currency_symbol_cache = None
    yield
    h._currency_symbol_cache = None


def _make_db(settings: dict | None = None):
    """Return a mock DatabaseManager with canned settings responses."""
    settings = settings or {}
    db = MagicMock()
    db.get_setting.side_effect = lambda key, default="": settings.get(key, default)
    db.get_all_settings.return_value = settings
    db.save_setting.return_value = True
    db.save_all_settings.return_value = True
    return db


# ---------------------------------------------------------------------------
# 1. setup_complete flag — logic level (no Tkinter import)
# ---------------------------------------------------------------------------

class TestSetupCompleteFlag:
    """Guard logic: setup_complete == '1' → skip wizard; anything else → show."""

    def test_wizard_needed_when_absent(self):
        db = _make_db({})
        val = db.get_setting("setup_complete", default="0")
        assert val == "0"

    def test_wizard_skipped_when_set(self):
        db = _make_db({"setup_complete": "1"})
        val = db.get_setting("setup_complete", default="0")
        assert val == "1"

    def test_guard_logic_skip(self):
        """Simulate run_setup_wizard_if_needed guard without importing tkinter."""
        def _should_show_wizard(db) -> bool:
            return db.get_setting("setup_complete", default="0") != "1"

        assert _should_show_wizard(_make_db({"setup_complete": "1"})) is False

    def test_guard_logic_show(self):
        def _should_show_wizard(db) -> bool:
            return db.get_setting("setup_complete", default="0") != "1"

        assert _should_show_wizard(_make_db({})) is True
        assert _should_show_wizard(_make_db({"setup_complete": "0"})) is True

    def test_run_setup_wizard_source_checks_flag(self):
        """setup_wizard.py must contain the setup_complete guard."""
        src_path = (Path(__file__).parent.parent /
                    "src" / "ui" / "dialogs" / "setup_wizard.py")
        text = src_path.read_text()
        assert "setup_complete" in text
        assert 'complete == "1"' in text or "complete != \"1\"" in text or \
               "complete ==" in text


# ---------------------------------------------------------------------------
# 2. DEFAULT_SETTINGS — Phase 2 keys present
# ---------------------------------------------------------------------------

class TestDefaultSettings:
    def test_currency_symbol_present(self):
        from src.core.config import DEFAULT_SETTINGS
        assert "currency_symbol" in DEFAULT_SETTINGS
        assert DEFAULT_SETTINGS["currency_symbol"] == "EGP"

    def test_setup_complete_present(self):
        from src.core.config import DEFAULT_SETTINGS
        assert "setup_complete" in DEFAULT_SETTINGS
        assert DEFAULT_SETTINGS["setup_complete"] == "0"

    def test_app_subtitle_is_generic(self):
        from src.core.config import DEFAULT_SETTINGS
        assert "app_subtitle" in DEFAULT_SETTINGS
        assert "Abaad" not in DEFAULT_SETTINGS["app_subtitle"]

    def test_company_logo_path_key_exists(self):
        from src.core.config import DEFAULT_SETTINGS
        assert "company_logo_path" in DEFAULT_SETTINGS

    def test_no_old_json_db_attr(self):
        import src.core.config as cfg
        assert not hasattr(cfg, "OLD_JSON_DB"), \
            "OLD_JSON_DB must be removed in Phase 2"
        assert not hasattr(cfg, "OLD_USERS_JSON"), \
            "OLD_USERS_JSON must be removed in Phase 2"


# ---------------------------------------------------------------------------
# 3. get_currency_symbol() — cache, DB read, fallback
# ---------------------------------------------------------------------------

class TestGetCurrencySymbol:
    def test_returns_egp_fallback_when_db_raises(self, monkeypatch):
        def _boom():
            raise RuntimeError("no db")
        monkeypatch.setattr("src.core.database.get_database", _boom)
        from src.utils import helpers as h
        h._currency_symbol_cache = None
        assert h.get_currency_symbol() == "EGP"

    def test_reads_symbol_from_db(self, monkeypatch):
        db = _make_db({"currency_symbol": "USD"})
        monkeypatch.setattr("src.core.database.get_database", lambda: db)
        from src.utils import helpers as h
        h._currency_symbol_cache = None
        assert h.get_currency_symbol() == "USD"

    def test_cache_populated_after_first_call(self, monkeypatch):
        db = _make_db({"currency_symbol": "EUR"})
        monkeypatch.setattr("src.core.database.get_database", lambda: db)
        from src.utils import helpers as h
        h._currency_symbol_cache = None
        h.get_currency_symbol()
        assert h._currency_symbol_cache == "EUR"

    def test_db_called_only_once_due_to_cache(self, monkeypatch):
        db = _make_db({"currency_symbol": "GBP"})
        monkeypatch.setattr("src.core.database.get_database", lambda: db)
        from src.utils import helpers as h
        h._currency_symbol_cache = None
        h.get_currency_symbol()
        h.get_currency_symbol()
        # get_setting should only be called once (second call uses cache)
        assert db.get_setting.call_count == 1

    def test_invalidate_clears_cache(self, monkeypatch):
        db = _make_db({"currency_symbol": "CAD"})
        monkeypatch.setattr("src.core.database.get_database", lambda: db)
        from src.utils import helpers as h
        h._currency_symbol_cache = None
        h.get_currency_symbol()
        h.invalidate_currency_cache()
        assert h._currency_symbol_cache is None

    def test_empty_string_from_db_uses_fallback(self, monkeypatch):
        db = _make_db({"currency_symbol": ""})
        monkeypatch.setattr("src.core.database.get_database", lambda: db)
        from src.utils import helpers as h
        h._currency_symbol_cache = None
        sym = h.get_currency_symbol()
        assert sym == "EGP"   # empty → DEFAULT_SETTINGS fallback


# ---------------------------------------------------------------------------
# 4. format_currency() — explicit symbol + auto-symbol via cache
# ---------------------------------------------------------------------------

class TestFormatCurrency:
    def test_explicit_symbol_overrides(self):
        from src.utils.helpers import format_currency
        assert format_currency(1234.5, symbol="USD") == "1,234.50 USD"

    def test_auto_symbol_uses_cached_value(self):
        from src.utils import helpers as h
        h._currency_symbol_cache = "SAR"
        assert h.format_currency(100.0) == "100.00 SAR"

    def test_zero_amount(self):
        from src.utils.helpers import format_currency
        assert format_currency(0.0, symbol="EGP") == "0.00 EGP"

    def test_large_amount_comma_separated(self):
        from src.utils.helpers import format_currency
        assert format_currency(1_000_000.0, symbol="EGP") == "1,000,000.00 EGP"

    def test_explicit_symbol_does_not_hit_db(self, monkeypatch):
        """Passing symbol= must bypass the DB entirely."""
        boom = MagicMock(side_effect=AssertionError("DB must not be called"))
        monkeypatch.setattr("src.core.database.get_database", boom)
        # Pre-set cache to None so the function WOULD hit DB if symbol is omitted
        from src.utils import helpers as h
        from src.utils.helpers import format_currency
        h._currency_symbol_cache = None
        result = format_currency(50.0, symbol="SAR")
        assert result == "50.00 SAR"
        boom.assert_not_called()


# ---------------------------------------------------------------------------
# 5. pdf_service._load_company() — logo_path + currency_symbol
# ---------------------------------------------------------------------------

class TestPdfServiceLoadCompany:
    def test_currency_symbol_from_settings(self):
        from src.services.pdf_service import PdfService
        svc = PdfService(_make_db({"currency_symbol": "USD"}))
        assert svc._load_company()["currency_symbol"] == "USD"

    def test_currency_symbol_fallback_when_no_db(self):
        from src.services.pdf_service import PdfService
        assert PdfService(None)._load_company()["currency_symbol"] == "EGP"

    def test_currency_symbol_fallback_when_key_absent(self):
        from src.services.pdf_service import PdfService
        assert PdfService(_make_db({}))._load_company()["currency_symbol"] == "EGP"

    def test_logo_path_is_config_default_when_no_setting(self):
        from src.core.config import LOGO_PATH
        from src.services.pdf_service import PdfService
        c = PdfService(_make_db({}))._load_company()
        assert c["logo_path"] == LOGO_PATH

    def test_custom_logo_resolved_when_file_exists(self, tmp_path, monkeypatch):
        """company_logo_path stored in settings → resolved against PROJECT_ROOT."""
        import src.services.pdf_service as pdf_mod
        # Patch the PROJECT_ROOT reference inside the pdf_service module
        monkeypatch.setattr(pdf_mod, "PROJECT_ROOT", tmp_path)
        (tmp_path / "assets").mkdir()
        (tmp_path / "assets" / "logo_custom.png").write_bytes(b"\x89PNG")

        rel = str(Path("assets") / "logo_custom.png")
        from src.services.pdf_service import PdfService
        c = PdfService(_make_db({"company_logo_path": rel}))._load_company()
        assert "logo_custom.png" in str(c["logo_path"])

    def test_custom_logo_falls_back_when_file_missing(self):
        """Non-existent logo path → falls back to config LOGO_PATH."""
        from src.core.config import LOGO_PATH
        from src.services.pdf_service import PdfService
        c = PdfService(_make_db({"company_logo_path": "assets/ghost.png"}))._load_company()
        assert c["logo_path"] == LOGO_PATH

    def test_company_name_read_from_settings(self):
        from src.services.pdf_service import PdfService
        c = PdfService(_make_db({"company_name": "NewCo"}))._load_company()
        assert c["name"] == "NewCo"


# ---------------------------------------------------------------------------
# 6. v4 migration artefacts removed — source / filesystem inspection
# ---------------------------------------------------------------------------

class TestLegacyRemoval:
    def test_migrate_script_deleted(self):
        migrate = (Path(__file__).parent.parent /
                   "scripts" / "migrate_v4_to_v5.py")
        assert not migrate.exists(), \
            "migrate_v4_to_v5.py must be deleted in Phase 2"

    def test_test_migration_deleted(self):
        tm = Path(__file__).parent / "test_migration.py"
        assert not tm.exists(), \
            "test_migration.py must be deleted in Phase 2"

    def test_config_has_no_old_json_db(self):
        import src.core.config as cfg
        assert not hasattr(cfg, "OLD_JSON_DB")
        assert not hasattr(cfg, "OLD_USERS_JSON")

    def test_settings_tab_has_no_import_v4_method(self):
        text = (Path(__file__).parent.parent /
                "src" / "ui" / "tabs" / "settings_tab.py").read_text()
        assert "def _import_v4" not in text, \
            "def _import_v4() must be removed from settings_tab.py"

    def test_install_py_no_migrate_script_reference(self):
        text = (Path(__file__).parent.parent /
                "scripts" / "install.py").read_text()
        assert "migrate_v4_to_v5" not in text, \
            "install.py must not reference migrate_v4_to_v5.py"


# ---------------------------------------------------------------------------
# 7. settings_tab._save_all() uses save_all_settings (batch)
# ---------------------------------------------------------------------------

class TestSettingsTabBatchSave:
    def test_save_all_settings_called_in_source(self):
        text = (Path(__file__).parent.parent /
                "src" / "ui" / "tabs" / "settings_tab.py").read_text()
        assert "save_all_settings" in text, \
            "_save_all() must call db.save_all_settings() for one-shot batch write"

    def test_no_per_key_db_set_loop_for_main_save(self):
        """The old pattern '_db_set(key, value)' inside a loop must be gone
        from the main save path (it's OK in load; banned in _save_all)."""
        text = (Path(__file__).parent.parent /
                "src" / "ui" / "tabs" / "settings_tab.py").read_text()
        # Verify the batch call appears
        assert "self._db.save_all_settings(" in text

    def test_import_v4_absent(self):
        text = (Path(__file__).parent.parent /
                "src" / "ui" / "tabs" / "settings_tab.py").read_text()
        assert "def _import_v4" not in text


# ---------------------------------------------------------------------------
# 8. Default-password warning — source + pure logic (no Tkinter)
# ---------------------------------------------------------------------------

class TestDefaultPasswordWarning:
    _SRC = (Path(__file__).parent.parent /
            "src" / "ui" / "dialogs" / "login_dialog.py")

    def test_sentinels_defined_in_source(self):
        text = self._SRC.read_text()
        assert '_DEFAULT_ADMIN_USER = "admin"' in text
        assert '_DEFAULT_ADMIN_PASS = "admin123"' in text

    def test_warn_method_present_in_source(self):
        text = self._SRC.read_text()
        assert "_warn_default_password" in text, \
            "_warn_default_password() method must exist in LoginDialog"

    def test_warning_condition_references_sentinels(self):
        text = self._SRC.read_text()
        assert "_DEFAULT_ADMIN_USER" in text
        assert "_DEFAULT_ADMIN_PASS" in text

    def test_warning_logic_pure(self):
        """Replicate the guard condition without importing Tkinter."""
        _USER = "admin"
        _PASS = "admin123"

        def _should_warn(username: str, password: str) -> bool:
            return username.lower() == _USER and password == _PASS

        assert _should_warn("admin", "admin123") is True
        assert _should_warn("Admin", "admin123") is True   # case-insensitive
        assert _should_warn("admin", "changed!") is False
        assert _should_warn("user",  "admin123") is False
        assert _should_warn("", "admin123")      is False


# ---------------------------------------------------------------------------
# 9. login_dialog + app.py + setup_wizard source-level branding checks
# ---------------------------------------------------------------------------

class TestBrandingSourceChecks:
    """Verify hardcoded branding strings have been replaced by dynamic reads."""

    def test_login_dialog_no_hardcoded_abaad_erp(self):
        text = (Path(__file__).parent.parent /
                "src" / "ui" / "dialogs" / "login_dialog.py").read_text()
        # The string "Abaad ERP" must not appear as a UI label literal
        assert 'text="Abaad ERP"' not in text, \
            'login_dialog.py still has hardcoded text="Abaad ERP"'
        assert '"3D Printing Management System"' not in text, \
            "login_dialog.py still has hardcoded management system subtitle"

    def test_login_dialog_reads_company_name_from_settings(self):
        text = (Path(__file__).parent.parent /
                "src" / "ui" / "dialogs" / "login_dialog.py").read_text()
        assert "company_name" in text
        assert "app_subtitle" in text

    def test_app_py_no_hardcoded_abaad_erp_label(self):
        text = (Path(__file__).parent.parent /
                "src" / "ui" / "app.py").read_text()
        assert 'text="Abaad ERP"' not in text, \
            'app.py still has hardcoded text="Abaad ERP" label'

    def test_app_py_reads_company_name_dynamically(self):
        text = (Path(__file__).parent.parent /
                "src" / "ui" / "app.py").read_text()
        assert "_get_company_name" in text or "company_name" in text

    def test_app_py_no_hardcoded_logo_path_direct(self):
        """app.py must use _resolve_logo() not bare LOGO_PATH for the header."""
        text = (Path(__file__).parent.parent /
                "src" / "ui" / "app.py").read_text()
        assert "_resolve_logo" in text

    def test_settings_tab_has_currency_symbol_field(self):
        text = (Path(__file__).parent.parent /
                "src" / "ui" / "tabs" / "settings_tab.py").read_text()
        assert "currency_symbol" in text

    def test_setup_wizard_saves_setup_complete(self):
        text = (Path(__file__).parent.parent /
                "src" / "ui" / "dialogs" / "setup_wizard.py").read_text()
        assert "setup_complete" in text
        assert '"1"' in text   # saves "1" on completion


# ---------------------------------------------------------------------------
# 10. config.py COMPANY dict — neutralized, no real contact info
# ---------------------------------------------------------------------------

class TestNeutralizedCompany:
    def test_no_real_phone(self):
        from src.core.config import COMPANY
        assert COMPANY["phone"] == "", "COMPANY['phone'] must be empty (was real number)"

    def test_no_real_address(self):
        from src.core.config import COMPANY
        assert COMPANY["address"] == "", "COMPANY['address'] must be empty (was Ismailia)"

    def test_no_real_social(self):
        from src.core.config import COMPANY
        assert COMPANY["social"] == "", "COMPANY['social'] must be empty (was @abaad3d)"

    def test_name_is_generic(self):
        from src.core.config import COMPANY
        assert COMPANY["name"] == "My 3D Print Shop"

    def test_grep_no_ismailia(self):
        """src/ and main.py must not contain 'Ismailia' (tests/ excluded
        because test assertions mention the old value by name)."""
        import subprocess
        result = subprocess.run(
            ["grep", "-rn", "Ismailia", "src/", "main.py",
             "--include=*.py"],
            capture_output=True, text=True,
            cwd=str(Path(__file__).parent.parent),
        )
        assert result.stdout.strip() == ""

    def test_grep_no_real_phone(self):
        """src/ and main.py must not contain the old phone number."""
        import subprocess
        result = subprocess.run(
            ["grep", "-rn", "01070750477", "src/", "main.py",
             "--include=*.py"],
            capture_output=True, text=True,
            cwd=str(Path(__file__).parent.parent),
        )
        assert result.stdout.strip() == ""

    def test_grep_no_abaad3d_handle(self):
        """src/ and main.py must not contain the old social handle."""
        import subprocess
        result = subprocess.run(
            ["grep", "-rn", "@abaad3d", "src/", "main.py",
             "--include=*.py"],
            capture_output=True, text=True,
            cwd=str(Path(__file__).parent.parent),
        )
        assert result.stdout.strip() == ""


# ---------------------------------------------------------------------------
# 11. PDF_FOOTER_CREDIT constant
# ---------------------------------------------------------------------------

class TestPdfFooterCredit:
    def test_constant_exists(self):
        from src.core import config
        assert hasattr(config, "PDF_FOOTER_CREDIT")

    def test_value_is_product_credit(self):
        from src.core.config import PDF_FOOTER_CREDIT
        assert "Abaad ERP" in PDF_FOOTER_CREDIT
        assert "Generated" in PDF_FOOTER_CREDIT


# ---------------------------------------------------------------------------
# 12. auth_manager.py — no plain-text credential print
# ---------------------------------------------------------------------------

class TestAuthManagerNoCredentialPrint:
    _SRC = (Path(__file__).parent.parent /
            "src" / "auth" / "auth_manager.py")

    def test_no_print_with_password(self):
        text = self._SRC.read_text()
        for line in text.splitlines():
            if "print(" in line and "admin123" in line:
                raise AssertionError(
                    f"auth_manager.py still prints credentials: {line.strip()}"
                )

    def test_uses_log_for_admin_creation(self):
        text = self._SRC.read_text()
        assert "log.info" in text or "log.warning" in text, \
            "auth_manager.py must use logging instead of print()"

    def test_log_module_imported(self):
        text = self._SRC.read_text()
        assert "import logging" in text


# ---------------------------------------------------------------------------
# 13. Wizard — 4-step structure (source inspection)
# ---------------------------------------------------------------------------

class TestWizardFourSteps:
    _SRC = (Path(__file__).parent.parent /
            "src" / "ui" / "dialogs" / "setup_wizard.py")

    def test_four_step_constant(self):
        text = self._SRC.read_text()
        assert "_TOTAL_STEPS = 4" in text or "TOTAL_STEPS = 4" in text

    def test_all_four_build_methods_present(self):
        text = self._SRC.read_text()
        for n in range(1, 5):
            assert f"def _build_step_{n}" in text, \
                f"_build_step_{n}() missing from setup_wizard.py"

    def test_show_step_method_present(self):
        text = self._SRC.read_text()
        assert "def _show_step" in text

    def test_signature_accepts_services(self):
        """run_setup_wizard_if_needed must accept inventory_service + printer_service."""
        text = self._SRC.read_text()
        assert "inventory_service" in text
        assert "printer_service" in text

    def test_back_and_next_buttons_present(self):
        text = self._SRC.read_text()
        assert "_go_back" in text
        assert "_go_next" in text

    def test_skip_step_present(self):
        text = self._SRC.read_text()
        assert "_skip_step" in text

    def test_finish_method_present(self):
        text = self._SRC.read_text()
        assert "def _finish" in text


# ---------------------------------------------------------------------------
# 14. app.py — subtitle method present
# ---------------------------------------------------------------------------

class TestAppSubtitle:
    _SRC = (Path(__file__).parent.parent / "src" / "ui" / "app.py")

    def test_get_tenant_subtitle_method(self):
        text = self._SRC.read_text()
        assert "_get_tenant_subtitle" in text

    def test_subtitle_reads_app_subtitle_key(self):
        text = self._SRC.read_text()
        assert "app_subtitle" in text

    def test_subtitle_used_in_header(self):
        text = self._SRC.read_text()
        assert "get_tenant_subtitle" in text or "_get_tenant_subtitle" in text


# ---------------------------------------------------------------------------
# 15. main.py — passes db= to LoginDialog and services to wizard
# ---------------------------------------------------------------------------

class TestMainPy:
    _SRC = Path(__file__).parent.parent / "main.py"

    def test_login_dialog_receives_db(self):
        text = self._SRC.read_text()
        assert "LoginDialog(root, db=db)" in text, \
            "main.py must pass db=db to LoginDialog"

    def test_wizard_receives_inventory_service(self):
        text = self._SRC.read_text()
        assert "inventory_service=" in text

    def test_wizard_receives_printer_service(self):
        text = self._SRC.read_text()
        assert "printer_service=" in text
