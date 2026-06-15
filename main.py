"""
main.py
=======
Entry point for Abaad 3D Print Manager v5.0.
Keep this file under 60 lines — no business logic here.

Boot sequence
-------------
1.  Bootstrap runtime directories
2.  Open v5 SQLite database (singleton)
3.  Initialise auth manager
4.  Login loop:
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
    # 1. Directories
    from src.core.config import ensure_directories
    ensure_directories()

    # 2. Database (v5 SQLite, singleton)
    from src.core.database import get_database
    db = get_database()

    # 3. Auth
    from src.auth.auth_manager import get_auth_manager
    auth = get_auth_manager()
    auth.initialise(db)
    # 4. Login loop
    while True:
        root = tk.Tk()
        root.withdraw()

        from src.ui.dialogs.login_dialog import LoginDialog
        user = LoginDialog(root).result

        if user is None:
            root.destroy()
            break                    # cancelled → exit

        # Phase 4: PrinterService is built first and handed to OrderService
        # so update_status() can record completed print jobs (nozzle wear,
        # printed grams/minutes) when an order moves to "Ready".
        printer_service = _svc("printer_service", "PrinterService", db)
        services = {
            "order":     _svc("order_service",    "OrderService",     db,
                              printer_service=printer_service),
            "customer":  _svc("customer_service", "CustomerService",  db),
            "inventory": _svc("inventory_service","InventoryService", db),
            "printer":   printer_service,
            "finance":   _svc("finance_service",  "FinanceService",   db),
        }

        root.deiconify()
        from src.ui.app import App
        App(root, user, db, services)
        root.mainloop()
        # after mainloop returns (logout or close), loop back to login


def _svc(module: str, cls: str, db, **kwargs):
    import importlib
    mod = importlib.import_module(f"src.services.{module}")
    return getattr(mod, cls)(db, **kwargs)


if __name__ == "__main__":
    main()