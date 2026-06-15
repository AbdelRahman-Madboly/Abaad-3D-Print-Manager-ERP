"""
src/ui/dialogs/setup_wizard.py
==============================
First-run setup wizard for Print3D Manager v5.0.

Shown once on first launch (when the ``setup_complete`` setting is absent
or ``"0"``).  Collects company identity, logo, and currency, then writes
all values to the settings table and sets ``setup_complete = "1"``.

Usage (from main.py boot sequence)::

    from src.ui.dialogs.setup_wizard import run_setup_wizard_if_needed
    run_setup_wizard_if_needed(db, root)
"""

import shutil
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk
from typing import Optional

from src.core.config import (
    APP_TITLE, ASSETS_DIR, COMPANY, DEFAULT_SETTINGS, LOGO_PATH,
)
from src.ui.theme import Colors, Fonts


# ---------------------------------------------------------------------------
# Public helper — called from main.py
# ---------------------------------------------------------------------------

def run_setup_wizard_if_needed(db, parent: tk.Tk) -> None:
    """Show the setup wizard if ``setup_complete`` is not ``'1'``.

    Args:
        db:     DatabaseManager singleton.
        parent: Root Tk window (should already be withdrawn).
    """
    complete = db.get_setting("setup_complete", default="0")
    if complete == "1":
        return
    wizard = SetupWizard(parent, db)
    # wizard.result is True if the user completed it, False if they skipped.
    # Either way we continue — skipping just leaves defaults in place.


# ---------------------------------------------------------------------------
# Wizard dialog
# ---------------------------------------------------------------------------

class SetupWizard:
    """Modal first-run setup wizard.

    Args:
        parent: Root Tk window.
        db:     DatabaseManager instance for reading / writing settings.
    """

    def __init__(self, parent: tk.Tk, db) -> None:
        self._db     = db
        self._result = False
        self._logo_source: Optional[Path] = None  # user-chosen logo file

        self._win = tk.Toplevel(parent)
        self._win.title(f"Welcome — {APP_TITLE} Setup")
        self._win.resizable(False, False)
        self._win.grab_set()
        self._win.protocol("WM_DELETE_WINDOW", self._skip)

        self._build()
        self._centre(parent)
        self._win.wait_window()

    # ------------------------------------------------------------------
    # UI
    # ------------------------------------------------------------------

    def _build(self) -> None:
        outer = tk.Frame(self._win, bg=Colors.BG_DARK)
        outer.pack(fill=tk.BOTH, expand=True)

        # ---- Header ----
        hdr = tk.Frame(outer, bg=Colors.BG_DARK, pady=20, padx=24)
        hdr.pack(fill=tk.X)
        tk.Label(hdr, text="🖨 Welcome to Print3D Manager",
                 bg=Colors.BG_DARK, fg="white",
                 font=Fonts.TITLE).pack()
        tk.Label(hdr,
                 text="Let's set up your shop details. "
                      "You can change these later in Settings.",
                 bg=Colors.BG_DARK, fg=Colors.TEXT_LIGHT,
                 font=Fonts.SMALL, wraplength=440).pack(pady=(4, 0))

        # ---- Card ----
        card = tk.Frame(outer, bg=Colors.CARD, padx=32, pady=24)
        card.pack(fill=tk.BOTH, expand=True, padx=24, pady=(0, 20))
        card.columnconfigure(1, weight=1)

        row = 0

        # Section: Company
        tk.Label(card, text="Company Information",
                 bg=Colors.CARD, fg=Colors.PRIMARY,
                 font=Fonts.HEADER).grid(
            row=row, column=0, columnspan=3,
            sticky="w", pady=(0, 10))
        row += 1

        self._vars: dict = {}

        fields = [
            ("Company Name *",   "company_name",    COMPANY["name"]),
            ("Address",          "company_address", COMPANY["address"]),
            ("Phone",            "company_phone",   COMPANY["phone"]),
            ("Tagline",          "company_tagline", COMPANY["tagline"]),
            ("Social Handle",    "company_social",  COMPANY["social"]),
            ("App Subtitle",     "app_subtitle",
             DEFAULT_SETTINGS["app_subtitle"]),
        ]

        for label, key, default in fields:
            tk.Label(card, text=f"{label}:", bg=Colors.CARD,
                     fg=Colors.TEXT, font=Fonts.SMALL).grid(
                row=row, column=0, sticky="w",
                padx=(0, 12), pady=3)
            var = tk.StringVar(value=default)
            ttk.Entry(card, textvariable=var, width=36).grid(
                row=row, column=1, columnspan=2,
                sticky="ew", pady=3)
            self._vars[key] = var
            row += 1

        # Section: Currency
        ttk.Separator(card, orient="horizontal").grid(
            row=row, column=0, columnspan=3,
            sticky="ew", pady=(10, 6))
        row += 1

        tk.Label(card, text="Currency",
                 bg=Colors.CARD, fg=Colors.PRIMARY,
                 font=Fonts.HEADER).grid(
            row=row, column=0, columnspan=3,
            sticky="w", pady=(0, 6))
        row += 1

        tk.Label(card, text="Currency Symbol *:",
                 bg=Colors.CARD, fg=Colors.TEXT,
                 font=Fonts.SMALL).grid(
            row=row, column=0, sticky="w", padx=(0, 12), pady=3)
        self._currency_var = tk.StringVar(
            value=DEFAULT_SETTINGS["currency_symbol"])
        ttk.Entry(card, textvariable=self._currency_var, width=10).grid(
            row=row, column=1, sticky="w", pady=3)
        tk.Label(card, text="e.g. EGP, USD, EUR",
                 bg=Colors.CARD, fg=Colors.TEXT_SECONDARY,
                 font=Fonts.SMALL).grid(
            row=row, column=2, sticky="w", padx=(8, 0))
        row += 1

        # Default rate
        tk.Label(card, text="Default Rate / gram *:",
                 bg=Colors.CARD, fg=Colors.TEXT,
                 font=Fonts.SMALL).grid(
            row=row, column=0, sticky="w", padx=(0, 12), pady=3)
        self._rate_var = tk.StringVar(
            value=DEFAULT_SETTINGS["default_rate_per_gram"])
        ttk.Entry(card, textvariable=self._rate_var, width=10).grid(
            row=row, column=1, sticky="w", pady=3)
        row += 1

        # Section: Logo
        ttk.Separator(card, orient="horizontal").grid(
            row=row, column=0, columnspan=3,
            sticky="ew", pady=(10, 6))
        row += 1

        tk.Label(card, text="Logo (optional)",
                 bg=Colors.CARD, fg=Colors.PRIMARY,
                 font=Fonts.HEADER).grid(
            row=row, column=0, columnspan=3,
            sticky="w", pady=(0, 6))
        row += 1

        self._logo_lbl = tk.Label(
            card,
            text=f"Default: {LOGO_PATH.name}",
            bg=Colors.CARD, fg=Colors.TEXT_SECONDARY,
            font=Fonts.SMALL)
        self._logo_lbl.grid(
            row=row, column=0, columnspan=2, sticky="w", pady=3)
        ttk.Button(card, text="📂 Choose Logo…",
                   command=self._pick_logo).grid(
            row=row, column=2, sticky="e", pady=3)
        row += 1

        # ---- Buttons ----
        btn_row = tk.Frame(card, bg=Colors.CARD)
        btn_row.grid(row=row, column=0, columnspan=3,
                     sticky="e", pady=(16, 0))

        tk.Button(
            btn_row, text="Skip for now",
            bg=Colors.CARD, fg=Colors.TEXT_SECONDARY,
            font=Fonts.SMALL, relief=tk.FLAT, cursor="hand2",
            command=self._skip,
        ).pack(side=tk.LEFT, padx=(0, 8))

        tk.Button(
            btn_row, text="✅  Save & Continue",
            bg=Colors.PRIMARY, fg="white",
            font=Fonts.BUTTON_BOLD, relief=tk.FLAT,
            cursor="hand2", padx=14, pady=6,
            activebackground=Colors.PRIMARY_DARK,
            activeforeground="white",
            command=self._save,
        ).pack(side=tk.LEFT)

    # ------------------------------------------------------------------
    # Actions
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
        self._logo_lbl.config(
            text=self._logo_source.name,
            fg=Colors.SUCCESS)

    def _save(self) -> None:
        company_name = self._vars["company_name"].get().strip()
        if not company_name:
            messagebox.showwarning(
                "Required", "Company name is required.", parent=self._win)
            return

        currency = self._currency_var.get().strip() or "EGP"
        rate     = self._rate_var.get().strip() or \
                   DEFAULT_SETTINGS["default_rate_per_gram"]

        # Build settings dict
        settings: dict = {
            "setup_complete":        "1",
            "currency_symbol":       currency,
            "default_rate_per_gram": rate,
        }
        for key, var in self._vars.items():
            settings[key] = var.get().strip()

        # Copy logo if the user chose one
        logo_rel = ""
        if self._logo_source and self._logo_source.exists():
            try:
                ASSETS_DIR.mkdir(parents=True, exist_ok=True)
                dest = ASSETS_DIR / f"logo_custom{self._logo_source.suffix}"
                shutil.copy2(self._logo_source, dest)
                # Store relative path from PROJECT_ROOT
                logo_rel = str(Path("assets") / dest.name)
            except Exception as exc:
                messagebox.showwarning(
                    "Logo", f"Could not copy logo:\n{exc}", parent=self._win)
        settings["company_logo_path"] = logo_rel

        try:
            self._db.save_all_settings(settings)
        except Exception as exc:
            messagebox.showerror(
                "Save Error",
                f"Could not save settings:\n{exc}",
                parent=self._win)
            return

        # Invalidate currency cache so format_currency() picks up new symbol
        try:
            from src.utils.helpers import invalidate_currency_cache
            invalidate_currency_cache()
        except Exception:
            pass

        self._result = True
        self._win.destroy()

    def _skip(self) -> None:
        # Mark setup as complete even when skipped so the wizard doesn't
        # show again on the next launch.
        try:
            self._db.save_setting("setup_complete", "1")
        except Exception:
            pass
        self._result = False
        self._win.destroy()

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
