"""
main.py
=======
Entry point for Abaad 3D Print Manager v5.0.
Keep this file under 80 lines — no business logic here.

Boot sequence
-------------
1.  Bootstrap runtime directories
2.  Open v5 SQLite database (singleton)
3.  Initialise auth manager
4.  First-run setup wizard (before login — fresh install has no users yet)
5.  Login loop:
      show LoginDialog → on success build services and open App
      on window close / logout → loop back to login
      on dialog cancel → exit
"""

import logging
import tkinter as tk

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("abaad")


def main() -> None:
    from src.core.config import ensure_directories  # 1. Directories
    ensure_directories()

    from src.core.database import get_database  # 2. Database
    db = get_database()

    from src.auth.auth_manager import get_auth_manager  # 3. Auth
    get_auth_manager().initialise(db)

    wizard_root = tk.Tk()                               # 4. First-run wizard
    wizard_root.withdraw()
    from src.ui.dialogs.setup_wizard import run_setup_wizard_if_needed
    _inv_svc = _svc("inventory_service", "InventoryService", db)
    _prt_svc = _svc("printer_service",  "PrinterService",  db)
    run_setup_wizard_if_needed(db, wizard_root,
                               inventory_service=_inv_svc,
                               printer_service=_prt_svc)
    wizard_root.destroy()

    while True:                                         # 5. Login loop
        root = tk.Tk()
        root.withdraw()

        from src.ui.dialogs.login_dialog import LoginDialog
        user = LoginDialog(root, db=db).result

        if user is None:
            root.destroy()
            break

        printer_service = _svc("printer_service", "PrinterService", db)
        services = {
            "order":     _svc("order_service",    "OrderService",    db,
                              printer_service=printer_service),
            "customer":  _svc("customer_service", "CustomerService", db),
            "inventory": _svc("inventory_service","InventoryService",db),
            "printer":   printer_service,
            "finance":   _svc("finance_service",  "FinanceService",  db),
        }

        root.deiconify()
        from src.ui.app import App
        App(root, user, db, services)
        root.mainloop()


def _svc(module: str, cls: str, db, **kwargs):
    import importlib
    mod = importlib.import_module(f"src.services.{module}")
    return getattr(mod, cls)(db, **kwargs)


if __name__ == "__main__":
    main()
