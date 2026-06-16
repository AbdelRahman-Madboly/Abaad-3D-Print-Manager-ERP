# docs/ — Abaad ERP Project Documentation

Everything needed to plan, build, and extend Abaad ERP using Claude Code.
The actual source code lives in `src/`. This folder is the planning layer.

---

## How to use this folder

### Starting a Claude Code session

```bash
cat docs/CLAUDE.md          # always first — project context + rules
cat docs/skills/ABAAD-SKILL.md  # working patterns for this codebase
cat docs/phases/PHASE-N-PROMPT.md  # today's tasks
```

### After finishing a phase

1. Fill in the completion report template (at the bottom of the phase prompt)
2. Save it as `docs/phases/PHASE-N-REPORT.md`
3. Bring the report back to the architect (master chat) for review
4. Architect updates `CLAUDE.md` phase status table and issues next prompt

---

## Files in this folder

```
docs/
├── CLAUDE.md               ← Root context. Read first in every session.
├── MASTER-PLAN.md          ← Overall plan, honest current state, rationale
├── skills/
│   └── ABAAD-SKILL.md      ← Code patterns, test patterns, what not to do
└── phases/
    ├── PHASE-0-PROMPT.md   ← Repo audit (start here — no code changes)
    ├── PHASE-1-PROMPT.md   ← Core stabilization
    ├── PHASE-2-PROMPT.md   ← Tenant brand system
    ├── PHASE-3-PROMPT.md   ← Dashboard & analytics verification
    ├── PHASE-4-PROMPT.md   ← Git workflow & CI
    ├── PHASE-5-PROMPT.md   ← Launchers (Ubuntu .desktop + Windows)
    ├── PHASE-6-PROMPT.md   ← Cross-platform polish & UI/UX
    ├── PHASE-7-PROMPT.md   ← PDF service + code documentation
    ├── PHASE-8-PROMPT.md   ← PyInstaller packaging
    └── PHASE-N-REPORT.md   ← Added after each phase completes
```

---

## Phase sequence

| # | Name | Description |
|---|------|-------------|
| 0 | Repo Audit | Zero code changes. Find out exactly what's broken. |
| 1 | Core Stabilization | Fix all broken things. Get tests green. |
| 2 | Tenant Brand System | De-brand. First-run wizard. Any shop can use this. |
| 3 | Dashboard Verification | Confirm Phase 4 work is real and tested properly. |
| 4 | Git Workflow & CI | GitHub Actions. CHANGELOG. Branch protection. |
| 5 | Launchers | Ubuntu .desktop + Windows .bat. Venv install scripts. |
| 6 | Cross-platform Polish | Font fallback, empty states, tooltips, window sizing. |
| 7 | PDF + Documentation | Professional PDFs. Google-style docstrings. |
| 8 | Packaging | PyInstaller bundle. Ubuntu first, Windows future. |

---

## Current phase

**Phase 0 — Repo Audit & Honest Baseline**
See `docs/phases/PHASE-0-PROMPT.md`

Run it first. It has zero code changes and produces the ground-truth report
that all subsequent phases depend on.
