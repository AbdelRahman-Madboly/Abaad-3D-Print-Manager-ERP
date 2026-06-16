# ABAAD-SKILL.md — Claude Code Working Guide
> Read this alongside CLAUDE.md at the start of every Claude Code session.
> It is a reference, not a task list.

---

## Session startup checklist

```bash
# 1. Confirm location
pwd  # ~/projects/products/Abaad-3D-ERP

# 2. Check git state
git status
git log --oneline -5

# 3. Baseline test run — BEFORE touching any code
pytest -q
# Expected baseline: 190 passed / 1 skipped / 0 failed  (after Phase 2)

# 4. Read today's phase prompt
cat docs/phases/PHASE-3-PROMPT.md   # update number for current phase
```

**Rule: never start coding without a green baseline.**
If tests are already failing, fix them first (or note why they're failing
before your changes — so you don't accidentally blame yourself for a
pre-existing issue).

---

## Reading the codebase

```bash
# What methods does a service expose?
grep -n "def " src/services/order_service.py

# Where is a method called?
grep -rn "get_orders_needing_attention" src/ tests/

# What settings keys are used?
grep -rn "get_setting\|save_setting" src/ --include="*.py" | grep -v test

# What does the DB schema look like?
python3 -c "
import sqlite3
conn = sqlite3.connect('data/abaad_v5.db')
for row in conn.execute(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\"):
    name = row[0]
    cols = conn.execute(f'PRAGMA table_info({name})').fetchall()
    print(f'\\n{name}')
    for c in cols: print(f'  {c[1]} {c[2]}')
conn.close()
"

# Find all hardcoded Abaad business strings
grep -rn "Abaad\|abaad" src/ tests/ main.py --include="*.py" | grep -v "__pycache__"
```

---

## Test patterns

Tests use `DatabaseManager(":memory:")` for isolation. Never use the real
`data/abaad_v5.db` in tests.

```bash
pytest -q                        # all tests
pytest tests/test_X.py -v        # one file, verbose
pytest tests/test_X.py::TestY -v # one class
DISPLAY="" pytest -q             # simulate CI headless
```

### Writing a test

```python
import pytest
from src.core.database import DatabaseManager
from src.services.order_service import OrderService

@pytest.fixture
def db():
    return DatabaseManager(":memory:")

@pytest.fixture
def order_service(db):
    return OrderService(db)

class TestGetOrdersNeedingAttention:
    def test_empty_db_returns_empty(self, order_service):
        result = order_service.get_orders_needing_attention()
        assert result["ready_overdue"] == []
        assert result["payment_due"] == []

    def test_ready_overdue_detected(self, db, order_service):
        from datetime import datetime, timedelta
        # Seed a customer and order
        # Use relative dates — never hardcode "2024-01-01"
        overdue_date = (datetime.now() - timedelta(days=5)).isoformat()
        # ... set up fixture ...
        result = order_service.get_orders_needing_attention()
        assert len(result["ready_overdue"]) == 1
```

**Common test mistakes to avoid:**
- Hardcoded dates like `"2024-01-01"` — use `datetime.now() - timedelta(days=N)`
- Importing from `src.core.models` enums that were removed (use string literals)
- Calling `DatabaseManager()` with no args in tests (use `":memory:"`)
- Tests that open real Tk windows (headless CI will fail)

---

## Code patterns in this project

### Reading a setting with fallback
```python
from src.core import config

def _get_company_name(self) -> str:
    try:
        return self._db.get_setting("company_name") or config.COMPANY["name"]
    except Exception:
        return config.COMPANY["name"]
```

### Adding a typed DatabaseManager method
```python
# In src/core/database.py — NEVER add execute_query() or execute_update()
def get_orders_by_status(self, status: str) -> list[dict]:
    """Return all orders with the given status.

    Args:
        status: One of config.ORDER_STATUSES.

    Returns:
        List of plain dicts — one per row.
    """
    with self._connect() as conn:
        rows = conn.execute(
            "SELECT * FROM orders WHERE status = ? AND is_deleted = 0",
            (status,),
        ).fetchall()
    return [dict(r) for r in rows]
```

### Adding a service method
```python
# In src/services/order_service.py
def get_orders_by_status(self, status: str) -> list[Order]:
    """Return orders with the given status as Order dataclasses.

    Args:
        status: One of config.ORDER_STATUSES.

    Returns:
        List of Order objects.
    """
    rows = self._db.get_orders_by_status(status)
    return [Order.from_dict(r) for r in rows]
```

### Adding a tab to the notebook
```python
# In src/ui/app.py App._build_notebook()
if user.can_access_tab("newtab"):
    t = NewTab(
        self._nb,
        service=self._services["something"],
        user=user,
        on_status_change=self._notify,
    )
    self._nb.add(t, text="🆕 New Tab")
    self._tab_refs.append(t)
    self._tab_keys.append("newtab")
```

### Adding a permission for a new tab
```python
# In src/auth/auth_manager.py — User.can_access_tab() tab_map
tab_map = {
    "dashboard": Permission.VIEW_STATISTICS,
    "newtab":    Permission.VIEW_SOMETHING,  # add here
}
```

---

## What NOT to do

| Don't | Do instead |
|-------|-----------|
| Add `execute_query()` to DatabaseManager | Add a typed method with a clear name |
| Put SQL in a service | Put SQL in DatabaseManager, call from service |
| Put business logic in a tab | Put it in a service, call from tab |
| Commit directly to `develop` or `main` | Always use a branch + PR |
| Skip a failing test | Fix the root cause or explain why it's acceptable to skip |
| Hardcode a date in a test | Use `datetime.now() - timedelta(days=N)` |
| Fix out-of-scope things | Note in the completion report |
| Use `print()` for debugging | Use `logging.getLogger(__name__).debug(...)` |

---

## File ownership by phase

| File | Phase | Status |
|------|-------|--------|
| `src/core/config.py` | Phase 1 (missing DEFAULT_SETTINGS keys), Phase 2 (neutralize COMPANY dict) | ✅ done |
| `main.py` | Phase 2 (wire setup wizard + pass services) | ✅ done |
| `src/ui/app.py` | Phase 2 (header subtitle), Phase 5 (icon), Phase 6 (window size) | partial |
| `src/ui/dialogs/setup_wizard.py` | Phase 2 (4-step wizard) | ✅ done |
| `src/auth/auth_manager.py` | Phase 2 (replace print with logging) | ✅ done |
| `src/ui/theme.py` | Phase 5 (font fallback chain) | pending |
| `src/services/pdf_service.py` | Phase 7 (footer, tenant body, currency, default_cost_per_gram) | pending |
| `src/ui/widgets.py` | Phase 6 (Tooltip, ScrollableFrame, empty_state_label) | pending |
| `.github/workflows/ci.yml` | Phase 4 | pending |
| `CHANGELOG.md` | Phase 4 | pending |
| `docs/CONTRIBUTING.md` | Phase 4 | pending |
| `abaad-erp.desktop` | Phase 5 | pending |
| `scripts/install_linux.sh` | Phase 5 | pending |
| `abaad-erp.spec` | Phase 8 | pending |
| `Makefile` | Phase 8 | pending |

---

## Writing a completion report

At the end of every session, fill in the template at the bottom of the
phase prompt. Be specific — the architect uses this to decide if the
next phase can start, and to write the next prompt accurately.

Required:
- Every file changed, one sentence on what changed
- Exact pytest count: `N passed / N failed / N skipped`
- Every acceptance criterion checked [x] or [ ] with one-line note
- Any open question that needs an architect decision

Save as `docs/phases/PHASE-N-REPORT.md`.
