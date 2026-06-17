# Phase 9 — Release Prep (Changelog, Versioning, Final QA)
> **Type:** release engineering. Minimal app code changes.
> **Session start:** `cat docs/CLAUDE.md` then this file.
> **Prerequisite:** Phase 8 complete. Linux bundle working.
> **Branch:** `chore/phase-9-release-prep` off `develop`

---

## Goal

Produce a clean, tagged **v5.0.0** release of Abaad ERP.
This phase closes all deferred housekeeping and establishes the release
workflow that will be used for every future release.

---

## Tasks

### Task 1 — Write `CHANGELOG.md`

Create `CHANGELOG.md` at repo root following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

Summarise all eight phases under a single `[5.0.0]` entry (this is the
first public release; there is no v4 changelog to carry forward).

```markdown
# Changelog

All notable changes to Abaad ERP are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [SemVer](https://semver.org/).

## [Unreleased]

## [5.0.0] — YYYY-MM-DD

### Added
- Tenant brand system: first-run wizard, logo, company details in DB
- Dashboard with revenue/profit charts (matplotlib) and KPI stat cards
- PDF quotes and receipts: tenant header, Abaad footer credit, dynamic currency
- Google-style docstrings across entire src/ tree
- PyInstaller Linux bundle (dist/abaad-erp/, 165 MB)
- Makefile: install / test / lint / build / run / run-bundle / clean
- Ubuntu .desktop launcher + Windows .bat launcher
- Tooltip helper and ScrollableFrame widget
- Minimum window size enforcement

### Changed
- De-branded all hardcoded "Madboly" / "Admin" references → tenant-driven
- DatabaseManager returns plain dicts only (no SQL in services)
- auth_manager: logging instead of print for credentials
- Default settings now include default_cost_per_gram

### Fixed
- PDF currency hardcoded as "EGP" → reads currency_symbol from settings
- default_cost_per_gram missing from DEFAULT_SETTINGS
- Admin credentials printed to stdout on startup

### Removed
- stats_tab.py (replaced by dashboard_tab.py)
- OLD_JSON_DB / OLD_USERS_JSON references from config.py

[5.0.0]: https://github.com/AbdelRahman-Madboly/Abaad-3D-Print-Manager-ERP/releases/tag/v5.0.0
```

### Task 2 — Bump version in `pyproject.toml`

Confirm `version = "5.0.0"` — it should already be set. No change needed
if correct. If not, set it now.

### Task 3 — Fix the live DB gitignore gap

The known issue in `CLAUDE.md`:
> `data/abaad_v5.db` is tracked by git — `.gitignore` only excludes `data/*.db`
> but the file was committed before the rule existed.

Fix:
```bash
git rm --cached data/abaad_v5.db
git rm --cached data/users.json 2>/dev/null || true  # if also tracked
```

The `.gitignore` already has `data/*.db`. After `git rm --cached`, the
files stay on disk but are no longer tracked.

Also check `data/backups/.gitkeep` — that file is fine to keep tracked.

### Task 4 — Final QA: run the full test suite

```bash
python3 -m pytest -q
```

Target: **all tests passing, 0 failures**. If any fail, fix them now.
If skipped tests are legitimate (e.g. optional deps), document why.

### Task 5 — Ruff clean-pass

```bash
python3 -m ruff check src/ tests/ main.py
```

Resolve any remaining warnings. All phases should have left this clean;
confirm it stays that way.

### Task 6 — Tag and create the GitHub Release

```bash
# On develop, after all commits
git tag -a v5.0.0 -m "Abaad ERP v5.0.0 — first production release"
git push origin v5.0.0

# Create GitHub release from the tag
gh release create v5.0.0 \
  --title "Abaad ERP v5.0.0" \
  --notes-file CHANGELOG.md \
  --target develop
```

> Note: we tag `develop` (not `main`) for now — `main` promotion is a
> future step when the app is deployed to a real customer.

### Task 7 — Update `docs/CLAUDE.md`

- Mark Phase 9 ✅ DONE
- Remove the `data/abaad_v5.db` known issue (fixed in Task 3)
- Add Phase 10 as **NEXT** (or "backlog — no immediate next phase")

---

## Acceptance criteria

- [ ] `CHANGELOG.md` exists at repo root with a `[5.0.0]` entry.
- [ ] `pyproject.toml` version is `5.0.0`.
- [ ] `data/abaad_v5.db` is no longer tracked by git (`git ls-files data/`).
- [ ] `pytest -q` passes with 0 failures.
- [ ] `ruff check` exits clean.
- [ ] `git tag v5.0.0` exists and is pushed.
- [ ] GitHub Release `v5.0.0` created.
- [ ] `docs/CLAUDE.md` Phase 9 marked done.

---

## Git commits

```
chore(gitignore): untrack live DB and users.json from git history
docs(changelog): add CHANGELOG.md for v5.0.0 release
chore(release): tag v5.0.0 and publish GitHub release
docs(claude): mark phase 9 done
```

---

## Completion report template

```markdown
# Phase 9 Completion Report — Release Prep

## Summary

## Tasks Completed

## Files Changed / Added

## QA Results
- pytest: N passed / N skipped / N failed
- ruff: clean / issues found and fixed

## Release
- Tag: v5.0.0
- GitHub Release URL:

## Acceptance Criteria

## Notes
```
