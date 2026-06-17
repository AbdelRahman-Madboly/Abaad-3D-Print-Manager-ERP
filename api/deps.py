"""
api/deps.py
===========
Shared dependency injection for the FastAPI bridge.
Initialised once in the app lifespan; each router calls the getter functions.
"""

import secrets
from typing import Optional

from fastapi import Header, HTTPException

from src.auth.auth_manager import AuthManager, User, get_auth_manager
from src.core.config import ensure_directories
from src.core.database import DatabaseManager, get_database
from src.services.customer_service import CustomerService
from src.services.finance_service import FinanceService
from src.services.inventory_service import InventoryService
from src.services.order_service import OrderService
from src.services.pdf_service import PdfService as PDFService
from src.services.printer_service import PrinterService

# ---------------------------------------------------------------------------
# Module-level singletons (populated by init())
# ---------------------------------------------------------------------------

_db:            Optional[DatabaseManager]  = None
_auth:          Optional[AuthManager]      = None
_order_svc:     Optional[OrderService]     = None
_customer_svc:  Optional[CustomerService]  = None
_inventory_svc: Optional[InventoryService] = None
_printer_svc:   Optional[PrinterService]   = None
_finance_svc:   Optional[FinanceService]   = None
_pdf_svc:       Optional[PDFService]       = None

# token → User  (in-memory session store, fine for a local app)
_sessions: dict[str, User] = {}


# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

def init() -> None:
    global _db, _auth, _order_svc, _customer_svc, _inventory_svc
    global _printer_svc, _finance_svc, _pdf_svc
    ensure_directories()
    _db  = get_database()
    _auth = get_auth_manager()
    _auth.initialise(_db)
    _printer_svc   = PrinterService(_db)
    _order_svc     = OrderService(_db, printer_service=_printer_svc)
    _customer_svc  = CustomerService(_db)
    _inventory_svc = InventoryService(_db)
    _finance_svc   = FinanceService(_db)
    _pdf_svc       = PDFService(_db)


# ---------------------------------------------------------------------------
# Service getters (usable as FastAPI Depends callables)
# ---------------------------------------------------------------------------

def get_db() -> DatabaseManager:
    return _db

def get_auth() -> AuthManager:
    return _auth

def get_order_service() -> OrderService:
    return _order_svc

def get_customer_service() -> CustomerService:
    return _customer_svc

def get_inventory_service() -> InventoryService:
    return _inventory_svc

def get_printer_service() -> PrinterService:
    return _printer_svc

def get_finance_service() -> FinanceService:
    return _finance_svc

def get_pdf_service() -> PDFService:
    return _pdf_svc

def get_sessions() -> dict:
    return _sessions


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------

def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    """FastAPI dependency: extract Bearer token and return the session User."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    user = _sessions.get(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


def create_session(user: User) -> str:
    """Create a session token for *user* and store it in the session map."""
    token = secrets.token_hex(32)
    _sessions[token] = user
    return token


def remove_session(token: str) -> None:
    _sessions.pop(token, None)
