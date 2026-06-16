"""
src/ui/dialogs/setup_wizard.py
==============================
First-run setup wizard for Abaad ERP v5.0 — 4-step initial setup.

Steps
-----
1. Company identity (name, address, phone, tagline, social, currency, rate, logo)
2. Initial filament inventory (weight per colour)
3. First printer configuration
4. Cost defaults review + finish

Usage (from main.py boot sequence)::

    from src.ui.dialogs.setup_wizard import run_setup_wizard_if_needed
    run_setup_wizard_if_needed(db, parent,
                               inventory_service=inv_svc,
                               printer_service=prt_svc)
"""

import shutil
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk
from typing import Optional

from src.core.config import (
    APP_TITLE,
    ASSETS_DIR,
    COMPANY,
    DEFAULT_COLORS,
    DEFAULT_COST_PER_GRAM,
    DEFAULT_PRINTER_LIFETIME_KG,
    DEFAULT_PRINTER_PRICE,
    DEFAULT_SETTINGS,
    ELECTRICITY_RATE,
    LOGO_PATH,
    NOZZLE_COST,
    NOZZLE_LIFETIME_GRAMS,
)
from src.ui.theme import Colors, Fonts

_TOTAL_STEPS = 4


# ---------------------------------------------------------------------------
# Public helper — called from main.py
# ---------------------------------------------------------------------------

def run_setup_wizard_if_needed(db, parent: tk.Tk,
                                inventory_service=None,
                                printer_service=None) -> None:
    """Show the setup wizard if ``setup_complete`` is not ``'1'``.

    Args:
        db:                DatabaseManager singleton.
        parent:            Root Tk window (should already be withdrawn).
        inventory_service: InventoryService for Step 2 spool seeding.
        printer_service:   PrinterService for Step 3 printer creation.
    """
    complete = db.get_setting("setup_complete", default="0")
    if complete == "1":
        return
    SetupWizard(parent, db,
                inventory_service=inventory_service,
                printer_service=printer_service)


# ---------------------------------------------------------------------------
# Wizard dialog
# ---------------------------------------------------------------------------

class SetupWizard:
    """Modal first-run setup wizard (4 steps).

    Args:
        parent:            Root Tk window.
        db:                DatabaseManager instance.
        inventory_service: Optional InventoryService for Step 2.
        printer_service:   Optional PrinterService for Step 3.
    """

    def __init__(self, parent: tk.Tk, db,
                 inventory_service=None,
                 printer_service=None) -> None:
        self._db      = db
        self._inv_svc = inventory_service
        self._prt_svc = printer_service
        self._result  = False
        self._current_step = 1

        self._logo_source: Optional[Path] = None
        self._logo_lbl: Optional[tk.Label] = None

        # Per-step data vars (preserved across Back/Next)
        self._vars:          dict = {}  # Step 1 company fields
        self._currency_var:  Optional[tk.StringVar] = None
        self._rate_var:      Optional[tk.StringVar] = None
        self._filament_vars: dict = {}  # Step 2: color → StringVar
        self._printer_vars:  dict = {}  # Step 3: field key → StringVar
        self._review_vars:   dict = {}  # Step 4: cost-defaults review

        # Commit-once guards to prevent duplicate DB writes on Back+Next
        self._filament_committed = False
        self._printer_committed  = False

        self._win = tk.Toplevel(parent)
        self._win.title(f"Welcome — {APP_TITLE} Setup")
        self._win.resizable(False, False)
        self._win.grab_set()
        self._win.protocol("WM_DELETE_WINDOW", self._skip)

        self._build_shell()
        self._show_step(1)
        self._centre(parent)
        self._win.wait_window()

    # ------------------------------------------------------------------
    # Shell — fixed chrome; card area is rebuilt per step
    # ------------------------------------------------------------------

    def _build_shell(self) -> None:
        outer = tk.Frame(self._win, bg=Colors.BG_DARK)
        outer.pack(fill=tk.BOTH, expand=True)

        hdr = tk.Frame(outer, bg=Colors.BG_DARK, pady=16, padx=24)
        hdr.pack(fill=tk.X)
        tk.Label(hdr, text="🖨 Welcome to Print3D Manager",
                 bg=Colors.BG_DARK, fg="white",
                 font=Fonts.TITLE).pack()
        tk.Label(hdr,
                 text="Let's set up your shop details. "
                      "You can change these later in Settings.",
                 bg=Colors.BG_DARK, fg=Colors.TEXT_LIGHT,
                 font=Fonts.SMALL, wraplength=440).pack(pady=(4, 0))

        self._step_lbl = tk.Label(
            outer, text="Step 1 of 4",
            bg=Colors.BG_DARK, fg=Colors.PRIMARY,
            font=Fonts.BUTTON_BOLD)
        self._step_lbl.pack(pady=(4, 0))

        self._card_frame = tk.Frame(outer, bg=Colors.CARD, padx=32, pady=24)
        self._card_frame.pack(fill=tk.BOTH, expand=True, padx=24, pady=(8, 0))

        btn_outer = tk.Frame(outer, bg=Colors.BG_DARK, pady=12, padx=24)
        btn_outer.pack(fill=tk.X)
        self._btn_outer = btn_outer

        self._back_btn = tk.Button(
            btn_outer, text="← Back",
            bg=Colors.BG_DARK, fg=Colors.TEXT_LIGHT,
            font=Fonts.SMALL, relief=tk.FLAT, cursor="hand2",
            command=self._go_back)

        self._skip_btn = tk.Button(
            btn_outer, text="Skip step",
            bg=Colors.BG_DARK, fg=Colors.TEXT_SECONDARY,
            font=Fonts.SMALL, relief=tk.FLAT, cursor="hand2",
            command=self._skip_step)

        self._close_btn = tk.Button(
            btn_outer, text="Skip for now",
            bg=Colors.BG_DARK, fg=Colors.TEXT_SECONDARY,
            font=Fonts.SMALL, relief=tk.FLAT, cursor="hand2",
            command=self._skip)

        self._next_btn = tk.Button(
            btn_outer, text="Next →",
            bg=Colors.PRIMARY, fg="white",
            font=Fonts.BUTTON_BOLD, relief=tk.FLAT,
            cursor="hand2", padx=14, pady=6,
            activebackground=Colors.PRIMARY_DARK,
            activeforeground="white",
            command=self._go_next)

    def _refresh_buttons(self, n: int) -> None:
        """Re-pack navigation buttons in the correct order for step n."""
        for btn in (self._back_btn, self._skip_btn,
                    self._close_btn, self._next_btn):
            btn.pack_forget()

        self._back_btn.config(state=tk.NORMAL if n > 1 else tk.DISABLED)
        self._back_btn.pack(side=tk.LEFT, padx=(0, 4))

        if n in (2, 3):
            self._skip_btn.pack(side=tk.LEFT, padx=(0, 4))

        self._close_btn.pack(side=tk.LEFT, padx=(0, 4))

        if n == _TOTAL_STEPS:
            self._next_btn.config(text="✅ Finish Setup", command=self._finish)
        else:
            self._next_btn.config(text="Next →", command=self._go_next)
        self._next_btn.pack(side=tk.RIGHT)

    # ------------------------------------------------------------------
    # Step router
    # ------------------------------------------------------------------

    def _show_step(self, n: int) -> None:
        self._current_step = n
        for w in self._card_frame.winfo_children():
            w.destroy()
        self._card_frame.columnconfigure(1, weight=1)

        self._step_lbl.config(text=f"Step {n} of {_TOTAL_STEPS}")
        self._refresh_buttons(n)

        {1: self._build_step_1,
         2: self._build_step_2,
         3: self._build_step_3,
         4: self._build_step_4}[n]()

        self._win.update_idletasks()

    # ------------------------------------------------------------------
    # Step 1 — Company identity
    # ------------------------------------------------------------------

    def _build_step_1(self) -> None:
        card = self._card_frame
        row  = 0

        tk.Label(card, text="Company Information",
                 bg=Colors.CARD, fg=Colors.PRIMARY,
                 font=Fonts.HEADER).grid(
            row=row, column=0, columnspan=3,
            sticky="w", pady=(0, 10))
        row += 1

        fields = [
            ("Company Name *",   "company_name",    COMPANY["name"]),
            ("Address",          "company_address", COMPANY["address"]),
            ("Phone",            "company_phone",   COMPANY["phone"]),
            ("Tagline",          "company_tagline", COMPANY["tagline"]),
            ("Social Handle",    "company_social",  COMPANY["social"]),
            ("App Subtitle",     "app_subtitle",    DEFAULT_SETTINGS["app_subtitle"]),
        ]

        for label, key, default in fields:
            tk.Label(card, text=f"{label}:", bg=Colors.CARD,
                     fg=Colors.TEXT, font=Fonts.SMALL).grid(
                row=row, column=0, sticky="w", padx=(0, 12), pady=3)
            if key not in self._vars:
                self._vars[key] = tk.StringVar(value=default)
            ttk.Entry(card, textvariable=self._vars[key], width=36).grid(
                row=row, column=1, columnspan=2, sticky="ew", pady=3)
            row += 1

        ttk.Separator(card, orient="horizontal").grid(
            row=row, column=0, columnspan=3, sticky="ew", pady=(10, 6))
        row += 1

        tk.Label(card, text="Currency",
                 bg=Colors.CARD, fg=Colors.PRIMARY,
                 font=Fonts.HEADER).grid(
            row=row, column=0, columnspan=3, sticky="w", pady=(0, 6))
        row += 1

        tk.Label(card, text="Currency Symbol *:", bg=Colors.CARD,
                 fg=Colors.TEXT, font=Fonts.SMALL).grid(
            row=row, column=0, sticky="w", padx=(0, 12), pady=3)
        if self._currency_var is None:
            self._currency_var = tk.StringVar(value=DEFAULT_SETTINGS["currency_symbol"])
        ttk.Entry(card, textvariable=self._currency_var, width=10).grid(
            row=row, column=1, sticky="w", pady=3)
        tk.Label(card, text="e.g. EGP, USD, EUR",
                 bg=Colors.CARD, fg=Colors.TEXT_SECONDARY,
                 font=Fonts.SMALL).grid(
            row=row, column=2, sticky="w", padx=(8, 0))
        row += 1

        tk.Label(card, text="Default Rate / gram *:", bg=Colors.CARD,
                 fg=Colors.TEXT, font=Fonts.SMALL).grid(
            row=row, column=0, sticky="w", padx=(0, 12), pady=3)
        if self._rate_var is None:
            self._rate_var = tk.StringVar(value=DEFAULT_SETTINGS["default_rate_per_gram"])
        ttk.Entry(card, textvariable=self._rate_var, width=10).grid(
            row=row, column=1, sticky="w", pady=3)
        row += 1

        ttk.Separator(card, orient="horizontal").grid(
            row=row, column=0, columnspan=3, sticky="ew", pady=(10, 6))
        row += 1

        tk.Label(card, text="Logo (optional)", bg=Colors.CARD, fg=Colors.PRIMARY,
                 font=Fonts.HEADER).grid(
            row=row, column=0, columnspan=3, sticky="w", pady=(0, 6))
        row += 1

        logo_text = (self._logo_source.name if self._logo_source
                     else f"Default: {LOGO_PATH.name}")
        logo_fg   = Colors.SUCCESS if self._logo_source else Colors.TEXT_SECONDARY
        self._logo_lbl = tk.Label(card, text=logo_text,
                                   bg=Colors.CARD, fg=logo_fg, font=Fonts.SMALL)
        self._logo_lbl.grid(row=row, column=0, columnspan=2, sticky="w", pady=3)
        ttk.Button(card, text="📂 Choose Logo…",
                   command=self._pick_logo).grid(
            row=row, column=2, sticky="e", pady=3)

    # ------------------------------------------------------------------
    # Step 2 — Initial filament inventory
    # ------------------------------------------------------------------

    def _build_step_2(self) -> None:
        card = self._card_frame

        tk.Label(card, text="Initial Filament Inventory",
                 bg=Colors.CARD, fg=Colors.PRIMARY,
                 font=Fonts.HEADER).grid(
            row=0, column=0, columnspan=3, sticky="w", pady=(0, 4))
        tk.Label(card,
                 text="Enter the weight (grams) of each colour you currently have.\n"
                      "Leave 0 for colours you don't stock yet.",
                 bg=Colors.CARD, fg=Colors.TEXT_SECONDARY,
                 font=Fonts.SMALL, wraplength=380).grid(
            row=1, column=0, columnspan=3, sticky="w", pady=(0, 10))

        for i, color in enumerate(DEFAULT_COLORS):
            row_num = i + 2
            tk.Label(card, text=f"{color}:", bg=Colors.CARD,
                     fg=Colors.TEXT, font=Fonts.SMALL).grid(
                row=row_num, column=0, sticky="w", padx=(0, 12), pady=3)
            if color not in self._filament_vars:
                self._filament_vars[color] = tk.StringVar(value="0")
            ttk.Entry(card, textvariable=self._filament_vars[color],
                      width=10).grid(row=row_num, column=1, sticky="w", pady=3)
            tk.Label(card, text="g", bg=Colors.CARD,
                     fg=Colors.TEXT_SECONDARY, font=Fonts.SMALL).grid(
                row=row_num, column=2, sticky="w", padx=(4, 0))

    # ------------------------------------------------------------------
    # Step 3 — First printer
    # ------------------------------------------------------------------

    def _build_step_3(self) -> None:
        card = self._card_frame

        tk.Label(card, text="First Printer",
                 bg=Colors.CARD, fg=Colors.PRIMARY,
                 font=Fonts.HEADER).grid(
            row=0, column=0, columnspan=3, sticky="w", pady=(0, 4))
        tk.Label(card,
                 text="Configure your first printer. "
                      "You can add more later in the Printers tab.",
                 bg=Colors.CARD, fg=Colors.TEXT_SECONDARY,
                 font=Fonts.SMALL, wraplength=380).grid(
            row=1, column=0, columnspan=3, sticky="w", pady=(0, 10))

        fields = [
            ("printer_name",          "Printer Name *",         "Printer 1"),
            ("printer_price",         "Purchase Price (EGP)",   str(DEFAULT_PRINTER_PRICE)),
            ("printer_lifetime_kg",   "Lifetime (kg)",          str(DEFAULT_PRINTER_LIFETIME_KG)),
            ("electricity_rate",      "Electricity (EGP/hr)",   str(ELECTRICITY_RATE)),
            ("nozzle_cost",           "Nozzle Cost (EGP)",      str(NOZZLE_COST)),
            ("nozzle_lifetime_grams", "Nozzle Lifetime (g)",    str(NOZZLE_LIFETIME_GRAMS)),
        ]

        for i, (key, label, default) in enumerate(fields):
            row_num = i + 2
            tk.Label(card, text=f"{label}:", bg=Colors.CARD,
                     fg=Colors.TEXT, font=Fonts.SMALL).grid(
                row=row_num, column=0, sticky="w", padx=(0, 12), pady=3)
            if key not in self._printer_vars:
                self._printer_vars[key] = tk.StringVar(value=default)
            ttk.Entry(card, textvariable=self._printer_vars[key],
                      width=20).grid(row=row_num, column=1, columnspan=2,
                                     sticky="w", pady=3)

    # ------------------------------------------------------------------
    # Step 4 — Cost defaults review
    # ------------------------------------------------------------------

    def _build_step_4(self) -> None:
        card = self._card_frame

        tk.Label(card, text="Cost Defaults",
                 bg=Colors.CARD, fg=Colors.PRIMARY,
                 font=Fonts.HEADER).grid(
            row=0, column=0, columnspan=3, sticky="w", pady=(0, 4))
        tk.Label(card,
                 text="Review and confirm your default cost settings before finishing.",
                 bg=Colors.CARD, fg=Colors.TEXT_SECONDARY,
                 font=Fonts.SMALL, wraplength=380).grid(
            row=1, column=0, columnspan=3, sticky="w", pady=(0, 10))

        rate_val = (self._rate_var.get() if self._rate_var
                    else DEFAULT_SETTINGS["default_rate_per_gram"])

        fields = [
            ("review_rate",     "Selling Rate / gram",     rate_val),
            ("review_material", "Material Cost / gram",    str(DEFAULT_COST_PER_GRAM)),
            ("review_deposit",  "Deposit %",               DEFAULT_SETTINGS["deposit_percent"]),
            ("review_validity", "Quote Validity (days)",   DEFAULT_SETTINGS["quote_validity_days"]),
        ]

        for i, (key, label, default) in enumerate(fields):
            row_num = i + 2
            tk.Label(card, text=f"{label}:", bg=Colors.CARD,
                     fg=Colors.TEXT, font=Fonts.SMALL).grid(
                row=row_num, column=0, sticky="w", padx=(0, 12), pady=3)
            if key not in self._review_vars:
                self._review_vars[key] = tk.StringVar(value=default)
            ttk.Entry(card, textvariable=self._review_vars[key],
                      width=14).grid(row=row_num, column=1, columnspan=2,
                                     sticky="w", pady=3)

    # ------------------------------------------------------------------
    # Navigation
    # ------------------------------------------------------------------

    def _go_next(self) -> None:
        if self._current_step == 1:
            if not self._validate_step_1():
                return
        elif self._current_step == 2:
            self._commit_filament()
        elif self._current_step == 3:
            self._commit_printer()

        if self._current_step < _TOTAL_STEPS:
            self._show_step(self._current_step + 1)

    def _go_back(self) -> None:
        if self._current_step > 1:
            self._show_step(self._current_step - 1)

    def _skip_step(self) -> None:
        """Skip optional step (2 or 3) without performing its DB writes."""
        if self._current_step < _TOTAL_STEPS:
            self._show_step(self._current_step + 1)

    def _finish(self) -> None:
        self._commit_all_settings()

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def _validate_step_1(self) -> bool:
        if not self._vars.get("company_name", tk.StringVar()).get().strip():
            messagebox.showwarning(
                "Required", "Company name is required.", parent=self._win)
            return False
        return True

    # ------------------------------------------------------------------
    # Step 2: commit filament spools
    # ------------------------------------------------------------------

    def _commit_filament(self) -> None:
        if self._filament_committed or self._inv_svc is None:
            return
        for color, var in self._filament_vars.items():
            try:
                grams = float(var.get() or "0")
            except ValueError:
                grams = 0.0
            if grams > 0:
                try:
                    self._inv_svc.add_spool(color=color,
                                            initial_weight_grams=grams)
                except Exception:
                    pass
        self._filament_committed = True

    # ------------------------------------------------------------------
    # Step 3: commit printer
    # ------------------------------------------------------------------

    def _commit_printer(self) -> None:
        if self._printer_committed or self._prt_svc is None:
            return
        name = self._printer_vars.get(
            "printer_name", tk.StringVar()).get().strip()
        if not name:
            return
        try:
            def _f(key, default):
                try:
                    return float(self._printer_vars[key].get() or str(default))
                except (ValueError, KeyError):
                    return float(default)

            self._prt_svc.add_printer(
                name=name,
                purchase_price=_f("printer_price", DEFAULT_PRINTER_PRICE),
                lifetime_kg=_f("printer_lifetime_kg", DEFAULT_PRINTER_LIFETIME_KG),
                electricity_rate_per_hour=_f("electricity_rate", ELECTRICITY_RATE),
                nozzle_cost=_f("nozzle_cost", NOZZLE_COST),
                nozzle_lifetime_grams=_f("nozzle_lifetime_grams", NOZZLE_LIFETIME_GRAMS),
            )
            self._printer_committed = True
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Step 4: commit all settings
    # ------------------------------------------------------------------

    def _commit_all_settings(self) -> None:
        def _rv(key, fallback):
            v = self._review_vars.get(key)
            return (v.get().strip() if v else "") or fallback

        settings: dict = {
            "setup_complete":        "1",
            "currency_symbol":       (self._currency_var.get().strip()
                                      if self._currency_var else "") or "EGP",
            "default_rate_per_gram": _rv("review_rate",
                                         DEFAULT_SETTINGS["default_rate_per_gram"]),
            "default_cost_per_gram": _rv("review_material",
                                         str(DEFAULT_COST_PER_GRAM)),
            "deposit_percent":       _rv("review_deposit",
                                         DEFAULT_SETTINGS["deposit_percent"]),
            "quote_validity_days":   _rv("review_validity",
                                         DEFAULT_SETTINGS["quote_validity_days"]),
        }
        for key, var in self._vars.items():
            settings[key] = var.get().strip()

        logo_rel = ""
        if self._logo_source and self._logo_source.exists():
            try:
                ASSETS_DIR.mkdir(parents=True, exist_ok=True)
                dest = ASSETS_DIR / f"logo_custom{self._logo_source.suffix}"
                shutil.copy2(self._logo_source, dest)
                logo_rel = str(Path("assets") / dest.name)
            except Exception as exc:
                messagebox.showwarning(
                    "Logo", f"Could not copy logo:\n{exc}", parent=self._win)
        settings["company_logo_path"] = logo_rel

        try:
            self._db.save_all_settings(settings)
        except Exception as exc:
            messagebox.showerror(
                "Save Error", f"Could not save settings:\n{exc}", parent=self._win)
            return

        try:
            from src.utils.helpers import invalidate_currency_cache
            invalidate_currency_cache()
        except Exception:
            pass

        self._result = True
        self._win.destroy()

    # ------------------------------------------------------------------
    # Skip entire wizard
    # ------------------------------------------------------------------

    def _skip(self) -> None:
        try:
            self._db.save_setting("setup_complete", "1")
        except Exception:
            pass
        self._result = False
        self._win.destroy()

    # ------------------------------------------------------------------
    # Logo picker
    # ------------------------------------------------------------------

    def _pick_logo(self) -> None:
        path = filedialog.askopenfilename(
            title="Choose a logo image",
            filetypes=[
                ("Image files", "*.png *.jpg *.jpeg *.gif *.bmp *.ico"),
                ("All files", "*.*"),
            ],
        )
        if not path:
            return
        self._logo_source = Path(path)
        if self._logo_lbl:
            self._logo_lbl.config(text=self._logo_source.name, fg=Colors.SUCCESS)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _centre(self, parent: tk.Tk) -> None:
        self._win.update_idletasks()
        w  = self._win.winfo_width()
        h  = self._win.winfo_height()
        sw = parent.winfo_screenwidth()
        sh = parent.winfo_screenheight()
        self._win.geometry(f"+{(sw - w) // 2}+{(sh - h) // 2}")
