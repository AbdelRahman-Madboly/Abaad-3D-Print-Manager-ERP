# docs/ — Abaad ERP Project Documentation

Developer context, phase history, and planning documents.
The live source code lives in `src/`, `api/`, and `frontend/`.

---

## Developer quick start

```bash
cat docs/DEVELOPER.md   # always first — project rules and architecture
```

---

## Phase status

| # | Name | Status | Test baseline |
|---|------|--------|---------------|
| 0 | Repo Audit & Honest Baseline | ✅ Done | — |
| 1 | Core Stabilization | ✅ Done | 165 passed / 1 skipped |
| 2 | Tenant Brand System | ✅ Done | 190 passed / 1 skipped |
| 3 | Dashboard & Analytics Verification | ✅ Done | 194 passed / 1 skipped |
| 4 | Git Workflow & CI | ✅ Done | 194 passed / 1 skipped |
| 5 | Launchers (Ubuntu + Windows) | ✅ Done | 194 passed / 1 skipped |
| 6 | Cross-platform Polish & UI/UX | ✅ Done | 194 passed / 1 skipped |
| 7 | PDF Service Polish + Documentation | ✅ Done | 199 passed / 1 skipped |
| 8 | Packaging (PyInstaller) | ✅ Done | 199 passed / 1 skipped |
| 9 | Release Prep (changelog, versioning) | ✅ Done | 199 passed / 1 skipped |
| 10 | React Full-Stack UI + FastAPI Bridge | ✅ Done — v6.0.0 released | CI green |

**All phases complete. Current release: v6.0.0**

---

## Files in this folder

```
docs/
├── DEVELOPER.md           ← Root developer context. Read first in every session.
├── CONTRIBUTING.md        ← Branch strategy and commit conventions
├── MASTER-PLAN.md         ← Overall plan and rationale
├── README.md              ← This file
├── USER-GUIDE.md          ← End-user walkthrough of every screen
├── phases/
│   ├── Prompt/            ← Phase prompt files (PHASE-N-PROMPT.md)
│   └── Report/            ← Phase completion reports (PHASE-N-REPORT.md)
├── skills/
│   └── ABAAD-SKILL.md     ← Code patterns and test patterns
├── ui-design/
│   └── ABAAD-DESIGN-BRIEF.md  ← Figma/React design brief (Phase 10)
└── archive/               ← Superseded planning documents
```
