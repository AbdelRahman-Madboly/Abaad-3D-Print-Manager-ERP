# Phase 3 — Dashboard & Analytics Verification
> **Type:** verify + fix. No new features unless something is broken.
> **Session start:** `cat docs/DEVELOPER.md` then this file.
> **Prerequisite:** Phase 2 complete — `pytest -q` baseline is **190 passed / 1 skipped / 0 failed**.
> **Branch:** `fix/phase-3-dashboard-verify` off `develop`

---

## Goal

The dashboard and analytics work was claimed complete in a prior "Phase 4"
report (114 passed / 1 skipped). Verify this is real and the tests are
meaningful — not just green because they test the wrong things. Fix anything
that is broken or untested.

---

## What was claimed done (from prior Phase 4 report)

- `src/ui/tabs/dashboard_tab.py` exists with 5 sections: Action Center,
  Headline Numbers, Charts, Printer Utilization, Detailed Breakdowns
- `src/ui/widgets.py` has `AlertCard` widget
- `OrderService.get_orders_needing_attention()` exists
- `PrinterService.get_printers_needing_maintenance()` exists
- `FinanceService.get_full_statistics()` uses `get_print_items_totals()`
  aggregate (not always-zero property sum)
- `OrderService.update_status()` calls `record_print_job()` on transition to "Ready"
- `app.py` uses `_tab_keys` / `_tab_refs` lists for dynamic tab navigation
- Old `StatsTab` and `AnalyticsTab` removed; `DashboardTab` placed first
- `auth_manager.py` has `"dashboard"` → `VIEW_STATISTICS` permission

---

## Tasks

### Task 1 — Existence check

Verify every claimed file/method exists:

```bash
# Check files
ls src/ui/tabs/dashboard_tab.py
ls src/ui/tabs/stats_tab.py 2>/dev/null && echo "STILL EXISTS (wrong)" || echo "removed (correct)"
ls src/ui/tabs/analytics_tab.py 2>/dev/null && echo "STILL EXISTS (wrong)" || echo "removed (correct)"

# Check methods
grep -n "def get_orders_needing_attention" src/services/order_service.py
grep -n "def get_printers_needing_maintenance" src/services/printer_service.py
grep -n "def get_print_items_totals" src/core/database.py
grep -n "def get_full_statistics" src/services/finance_service.py
grep -n "record_print_job" src/services/order_service.py
grep -n "_tab_keys\|_tab_refs" src/ui/app.py
grep -n "dashboard.*VIEW_STATISTICS\|\"dashboard\"" src/auth/auth_manager.py
grep -n "AlertCard" src/ui/widgets.py
```

For any that don't exist: note it as a gap to fix.

### Task 2 — Test quality audit

For each test file related to dashboard/analytics:
```bash
ls tests/test_dashboard_tab.py tests/test_printer_service.py tests/test_order_service.py tests/test_finance_service.py 2>/dev/null
```

For each that exists, read it and assess:
- Do the tests actually verify behavior or just check that methods exist?
- Are edge cases covered (empty DB, zero printers, etc.)?
- Are the fixtures realistic?
- Do tests for `get_orders_needing_attention` use date arithmetic that
  would fail if run on a different date? (this is a common bug — use
  `datetime.now() - timedelta(days=N)` in fixtures, not hardcoded dates)

### Task 3 — Run tests and verify

```bash
pytest tests/test_dashboard_tab.py tests/test_printer_service.py \
       tests/test_order_service.py tests/test_finance_service.py -v
```

Report every failure. Fix root causes (not just the tests).

### Task 4 — Verify `get_full_statistics` is not zero

The old bug was `total_weight_printed` and `total_time_printed` always
returning 0. Verify the fix is real:

```bash
python3 -c "
from src.core.database import DatabaseManager
from src.services.finance_service import FinanceService
from src.services.order_service import OrderService
from src.services.inventory_service import InventoryService
from src.services.printer_service import PrinterService

db = DatabaseManager(':memory:')

# Seed: a printer
ps = PrinterService(db)
printer_id = ps.add_printer({'name': 'Printer 1', 'price': 25000,
    'lifetime_kg': 500, 'electricity_rate': 0.31,
    'nozzle_cost': 100, 'nozzle_lifetime_grams': 1500})

# Seed: an order with a print item assigned to the printer
os_ = OrderService(db, printer_service=ps)
# ... (add a customer, create order, add item with printer_id, set to Ready)
# Then check:
fs = FinanceService(db)
stats = fs.get_full_statistics()
print('total_weight_printed:', stats.get('total_weight_printed'))
print('total_time_printed:', stats.get('total_time_printed'))
print('Expected: non-zero values')
"
```

If this returns zeros, the fix from Phase 4 is not actually working.
Investigate and fix.

### Task 5 — Fix any gaps found

Work through every gap from Tasks 1-4. Priority order:
1. Missing methods/files (app would crash)
2. Tests that test nothing (false confidence)
3. Edge cases that are untested
4. Date-dependent tests (make them use relative dates)

### Task 6 — Full suite

```bash
pytest -q
```

Must be green before closing this phase. Report exact counts.

### Task 7 — Smoke test the dashboard

Launch the app with a seeded DB and visually verify:
- Dashboard tab loads as the first tab
- Action Center shows correct alert counts (manually verify with known data)
- Clicking an alert card switches to the correct tab
- Charts render (or show "No data" placeholder) — no Python exceptions
- Printer Utilization section shows printer rows
- Detailed Breakdowns section populates

```bash
python main.py
```

Report what you see. Note any visual issues for Phase 6 (UI/UX).

---

## Acceptance criteria

- [ ] All claimed methods/files from prior Phase 4 report exist on disk.
- [ ] `stats_tab.py` and `analytics_tab.py` do NOT exist.
- [ ] `get_full_statistics()` returns non-zero `total_weight_printed` /
      `total_time_printed` when seeded data exists.
- [ ] `get_orders_needing_attention()` returns correct results with
      seeded data (at least: empty DB, ready-overdue, payment-due cases covered).
- [ ] `get_printers_needing_maintenance()` returns correct results.
- [ ] No date-hardcoded test fixtures.
- [ ] `pytest -q` → zero failures.
- [ ] Dashboard smoke test: loads, no crashes, navigation works.

---

## Git commits

```
fix(finance): verify/fix get_full_statistics total_weight/time aggregate
fix(order): verify/fix get_orders_needing_attention date arithmetic
test(dashboard): strengthen test coverage, fix date-dependent fixtures
test(printer): add/fix edge case coverage for maintenance alert
fix(dashboard): [any specific UI/service fix found during verification]
```

---

## Completion Report

```markdown
# Phase 3 Completion Report — Dashboard & Analytics Verification

## Summary

## Existence check results
(What was there, what was missing)

## Test quality findings
(What tests were weak or wrong)

## get_full_statistics verification
(Was it returning zeros? What was fixed?)

## Smoke test observations
(What the dashboard looks like, any visual issues noted for Phase 6)

## Files Changed / Added

## Git Commits

## Tests
pytest result: N passed / N skipped / N failed

## Acceptance Criteria Status
- [x] / [ ] each

## Open Questions / Notes for Master Chat
```
