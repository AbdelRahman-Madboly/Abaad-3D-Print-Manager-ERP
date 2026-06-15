"""
src/utils/helpers.py  — v5.0  (Phase 2 update)
===============================================
All utility functions in one place.

Phase 2 changes:
  - format_currency() now reads currency_symbol from the settings DB via
    get_currency_symbol(), falling back to config.DEFAULT_SETTINGS default.
    The symbol is cached per-process; call invalidate_currency_cache() after
    the user changes it in Settings (the settings_tab _save_all already calls
    on_status_change which refreshes the UI, so a restart picks up the new
    symbol — this is acceptable for a desktop app).
  - Callers that already pass an explicit symbol= arg are unaffected.
"""

import math
import uuid
from datetime import datetime
from typing import Optional

from src.core.config import PAYMENT_FEES, DEFAULT_SETTINGS


# ---------------------------------------------------------------------------
# ID & Timestamp
# ---------------------------------------------------------------------------

def generate_id() -> str:
    """Return an 8-character unique identifier."""
    return str(uuid.uuid4())[:8]


def now_str() -> str:
    """Current datetime as ``'YYYY-MM-DD HH:MM:SS'``."""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def today_str() -> str:
    """Today's date as ``'YYYY-MM-DD'``."""
    return datetime.now().strftime("%Y-%m-%d")


# ---------------------------------------------------------------------------
# Time Formatting
# ---------------------------------------------------------------------------

def format_time(minutes: int) -> str:
    """Convert minutes to a human-readable string.

    Examples::

        format_time(90)   → '1h 30m'
        format_time(1500) → '1d 1h 0m'
    """
    if minutes <= 0:
        return "0m"
    days      = minutes // (24 * 60)
    remaining = minutes  % (24 * 60)
    hours     = remaining // 60
    mins      = remaining  % 60
    parts: list[str] = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    if mins or not parts:
        parts.append(f"{mins}m")
    return " ".join(parts)


# Alias used by the new v5 tabs
format_time_minutes = format_time


# ---------------------------------------------------------------------------
# Currency / Financial
# ---------------------------------------------------------------------------

# Module-level cache so we only hit the DB once per session.
_currency_symbol_cache: Optional[str] = None


def invalidate_currency_cache() -> None:
    """Clear the cached currency symbol (call after settings are saved)."""
    global _currency_symbol_cache
    _currency_symbol_cache = None


def get_currency_symbol() -> str:
    """Return the configured currency symbol, reading from DB once then caching.

    Design choice: we import DatabaseManager lazily (inside this function)
    to avoid circular imports at module load time, and we cache the result
    so subsequent calls to format_currency() are free.  The trade-off is
    that a currency change only takes effect on the next process launch —
    acceptable for a desktop ERP where settings changes are rare.
    """
    global _currency_symbol_cache
    if _currency_symbol_cache is not None:
        return _currency_symbol_cache

    fallback = DEFAULT_SETTINGS.get("currency_symbol", "EGP")
    try:
        from src.core.database import get_database
        db = get_database()
        symbol = db.get_setting("currency_symbol", default=fallback)
        _currency_symbol_cache = symbol or fallback
    except Exception:
        _currency_symbol_cache = fallback
    return _currency_symbol_cache


def calculate_payment_fee(amount: float, method: str) -> float:
    """Calculate payment-method transaction fee in EGP."""
    if amount <= 0:
        return 0.0
    params = PAYMENT_FEES.get(method)
    if params is None or params["rate"] == 0:
        return 0.0
    fee = amount * params["rate"]
    fee = max(params["min"], min(params["max"], fee))
    return round(fee, 2)


def format_currency(amount: float, symbol: Optional[str] = None) -> str:
    """Format a float as a currency string, e.g. ``'1,250.50 EGP'``.

    Args:
        amount: Numeric value to format.
        symbol: Override the currency symbol.  When omitted (None), the
                symbol is read from the ``currency_symbol`` setting in the
                database (cached after the first call).
    """
    if symbol is None:
        symbol = get_currency_symbol()
    return f"{amount:,.2f} {symbol}"


def round_to_half(value: float) -> float:
    """Round *value* to the nearest 0.5."""
    return round(value * 2) / 2


# ---------------------------------------------------------------------------
# Weight / Grams
# ---------------------------------------------------------------------------

def filament_length_to_grams(
    length_meters: float,
    diameter_mm: float = 1.75,
    density_g_cm3: float = 1.24,
) -> float:
    """Convert filament length (m) to weight (g) for 1.75 mm PLA."""
    radius_cm = (diameter_mm / 2) / 10
    length_cm = length_meters * 100
    volume_cm3 = math.pi * radius_cm ** 2 * length_cm
    return round(volume_cm3 * density_g_cm3, 2)


# ---------------------------------------------------------------------------
# String Helpers
# ---------------------------------------------------------------------------

def truncate(text: str, max_len: int = 40, suffix: str = "…") -> str:
    """Truncate *text* to *max_len* characters."""
    if len(text) <= max_len:
        return text
    return text[: max_len - len(suffix)] + suffix


def safe_float(value: object, default: float = 0.0) -> float:
    """Convert *value* to float, returning *default* on failure."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_int(value: object, default: int = 0) -> int:
    """Convert *value* to int, returning *default* on failure."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return default
