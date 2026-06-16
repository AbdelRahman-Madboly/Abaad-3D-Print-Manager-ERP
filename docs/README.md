# docs/ — Abaad ERP Project Documentation

Everything needed to plan, build, and extend Abaad ERP using Claude Code.
The actual source code lives in `src/`. This folder is the planning layer.

---

## How to start a Claude Code session

```bash
cat docs/CLAUDE.md                        # always first — project context + rules
cat docs/skills/ABAAD-SKILL.md            # working patterns for this codebase
cat docs/phases/PHASE-N-PROMPT.md         # today's tasks
```

---

## Phase status

| # | Name | Status | Test baseline |
|---|------|--------|---------------|
| 0 | Repo Audit & Honest Baseline | ✅ Done | — |
| 1 | Core Stabilization | ✅ Done | 76 passed / 1 skipped |
| 2 | Tenant Brand System | ✅ Done | 190 passed / 1 skipped |
| 3 | Dashboard & Analytics Verification | **▶ Current** | starts at 190 / 1 skipped |
| 4 | Git Workflow & CI | ⏳ Pending | — |
| 5 | Launchers (Ubuntu + Windows) | ⏳ Pending | — |
| 6 | Cross-platform Polish & UI/UX | ⏳ Pending | — |
| 7 | PDF Service Polish + Documentation | ⏳ Pending | — |
| 8 | Packaging (PyInstaller) | ⏳ Pending | — |

---

## After finishing a phase — update checklist

When a phase report (`PHASE-N-REPORT.md`) is written, work through this list.
Every item that changed must be updated before the next phase starts.

### Always update
1. **`docs/CLAUDE.md`** — Phase status table: mark `✅ DONE — N passed / N skipped / N failed`
2. **`docs/CLAUDE.md`** — Known Issues: strike through anything fixed; add any new issues raised in the report's Open Questions
3. **`docs/README.md`** — Phase status table: change `▶ Current` → `✅ Done` for finished phase; advance `▶ Current` to next phase; update test baseline
4. **`docs/phases/PHASE-{N+1}-PROMPT.md`** — Update the prerequisite line with the exact test count from the report

### Update only if relevant
5. **`docs/MASTER-PLAN.md`** — Update "Honest current state" if the completed phase changed what is broken or fixed
6. **`docs/phases/PHASE-{M}-PROMPT.md`** (later phases) — If the report's Open Questions flag something as "Phase M scope", add a task or note to that phase's prompt
7. **`docs/skills/ABAAD-SKILL.md`** — "File ownership by phase" table if new files were added or ownership changed; "Code patterns" if new patterns were established

### Never needed
- Re-reading the report back into CLAUDE.md verbatim — just the delta (new known issues, status change) goes there
- Updating prompts for phases that are already done

---

## Files in this folder

```
docs/
├── CLAUDE.md                  ← Root context. Read first in every session.
├── MASTER-PLAN.md             ← Overall plan, current state, rationale
├── README.md                  ← This file. Phase status + update checklist.
├── skills/
│   └── ABAAD-SKILL.md         ← Code patterns, test patterns, what not to do
└── phases/
    ├── PHASE-0-PROMPT.md      ✅ done
    ├── PHASE-0-REPORT.md
    ├── PHASE-1-PROMPT.md      ✅ done
    ├── PHASE-1-REPORT.md
    ├── PHASE-2-PROMPT.md      ✅ done
    ├── PHASE-2-REPORT.md
    ├── PHASE-3-PROMPT.md      ← current phase
    ├── PHASE-4-PROMPT.md
    ├── PHASE-5-PROMPT.md
    ├── PHASE-6-PROMPT.md
    ├── PHASE-7-PROMPT.md
    ├── PHASE-8-PROMPT.md
    └── archive/
        └── PHASE-4.5-PROMPT.md   ← superseded; work absorbed into Phase 2
```

---

## Current phase

**Phase 3 — Dashboard & Analytics Verification**
See `docs/phases/PHASE-3-PROMPT.md`

Test baseline entering this phase: **190 passed / 1 skipped / 0 failed**
