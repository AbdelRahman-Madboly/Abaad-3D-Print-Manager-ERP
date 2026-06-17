# Phase 10 — React UI/UX Redesign
> **Type:** new frontend. The Python/Tkinter UI is replaced with React + shadcn/ui.
> **Session start:** `cat docs/CLAUDE.md` then this file.
> **Prerequisite:** Phase 9 complete. Figma design generated from `docs/ui-design/ABAAD-DESIGN-BRIEF.md`.
> **Branch:** `feat/phase-10-react-ui` off `develop`

---

## Goal

Replace the Tkinter UI with a React web frontend. The Python backend (services +
DB layer) stays unchanged. The React app communicates with it via a thin local
HTTP API (FastAPI or Flask) running on localhost. A future phase wraps everything
in Tauri or Electron for desktop packaging.

---

## Prerequisites before starting this phase

1. Open `docs/ui-design/ABAAD-DESIGN-BRIEF.md` in your Figma AI plugin.
2. Generate the React component tree (see "Expected React file tree" in the brief).
3. Copy the generated project into `frontend/` at the repo root.
4. Then follow the tasks below.

---

## Repo structure after this phase

```
Abaad-3D-ERP/
├── src/                  ← Python backend (unchanged)
├── frontend/             ← NEW: React app (Figma output + polish)
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   └── ...
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── api/                  ← NEW: FastAPI bridge (thin HTTP wrapper over src/services/)
│   ├── main.py
│   └── routers/
│       ├── orders.py
│       ├── customers.py
│       ├── filament.py
│       ├── printers.py
│       ├── expenses.py
│       ├── failures.py
│       ├── settings.py
│       └── auth.py
├── main.py               ← existing Python entry point (unchanged)
└── ...
```

---

## Tasks

### Task 1 — Bootstrap the React project

If Figma generated the files already, place them in `frontend/`. Otherwise scaffold:

```bash
cd frontend
pnpm create vite . --template react-ts
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx shadcn@latest init
pnpm add lucide-react recharts
```

Add all shadcn/ui components listed in the design brief:
```bash
pnpm dlx shadcn@latest add button card badge input label select dialog \
  table tabs progress scroll-area separator tooltip checkbox avatar \
  dropdown-menu form popover accordion alert skeleton
```

### Task 2 — Apply Abaad theme

Copy `docs/ui-design/ABAAD-DESIGN-BRIEF.md` shadcn CSS variables into
`frontend/src/styles/theme.css`. Add Inter font via `fonts.css`.

### Task 3 — Implement `AppLayout.tsx`

Sidebar nav (240 px, `bg-dark`), content area (`flex-1`), status bar (28 px).
Nav items: Dashboard, Orders, Customers, Filament, Printers, Expenses, Failures, Settings.
Bottom: user avatar + name + logout button.

Use React Router for navigation.

### Task 4 — Implement all screen components

Port each screen from the design brief (or refine the Figma output):

| Component | Key behaviour |
|-----------|---------------|
| `Login.tsx` | POST `/api/auth/login`, store JWT in memory (not localStorage) |
| `SetupWizard.tsx` | 4-step modal; shown when `setup_complete = "0"` |
| `Dashboard.tsx` | GET `/api/dashboard/summary?period=month`; recharts bar chart |
| `Orders.tsx` | Two-panel; list + order form; real-time total calc |
| `ItemDialog.tsx` | Modal for print item; calc cost on weight change |
| `Customers.tsx` | Two-panel; list + detail + order history |
| `Filament.tsx` | Table with color swatches + progress bars |
| `Printers.tsx` | Two-panel; list + detail + nozzle progress |
| `Expenses.tsx` | Table + filter + summary cards |
| `Failures.tsx` | Table + filter + summary cards |
| `Settings.tsx` | Grouped form sections; logo upload preview |

### Task 5 — FastAPI bridge (`api/`)

```bash
pip install fastapi uvicorn
```

Create `api/main.py` that imports the existing `src/services/` and exposes them
as REST endpoints. The DB path is read from the same `config.py` as the Python app.

Key endpoints (minimum viable):
```
POST  /api/auth/login
GET   /api/auth/me
POST  /api/auth/logout

GET   /api/orders           ?status=&search=
POST  /api/orders
PUT   /api/orders/{id}
GET   /api/orders/{id}/pdf/quote
GET   /api/orders/{id}/pdf/receipt

GET   /api/customers        ?search=
POST  /api/customers
PUT   /api/customers/{id}
DELETE /api/customers/{id}

GET   /api/filament
POST  /api/filament
PUT   /api/filament/{id}

GET   /api/printers
POST  /api/printers
PUT   /api/printers/{id}

GET   /api/expenses         ?category=&month=
POST  /api/expenses
PUT   /api/expenses/{id}
DELETE /api/expenses/{id}

GET   /api/failures         ?reason=&source=
POST  /api/failures
DELETE /api/failures/{id}

GET   /api/settings
POST  /api/settings

GET   /api/dashboard/summary  ?period=month|year|week
```

### Task 6 — Dev server integration

Add `Makefile` targets:
```makefile
api:
    uvicorn api.main:app --reload --port 8000

frontend:
    cd frontend && pnpm dev

dev:
    make -j2 api frontend
```

CORS: allow `http://localhost:5173` (Vite dev server).

### Task 7 — Polish and QA

- All stat cards match values from the Python test suite
- Empty-state messages for every empty list
- Loading skeletons while fetching
- Error toast (sonner) on API failure
- Responsive sidebar: collapses to icon-only at < 1024 px width
- RTL-safe layout (use `ms-`/`me-` Tailwind utilities)

---

## Acceptance criteria

- [ ] `make dev` starts both API (port 8000) and React (port 5173).
- [ ] Login screen authenticates against the real SQLite DB.
- [ ] Setup wizard fires on fresh DB and sets `setup_complete = "1"`.
- [ ] All 8 tabs render with real data.
- [ ] Order form creates an order; PDF download works.
- [ ] `pytest -q` still passes (backend unchanged).
- [ ] `pnpm build` produces a dist/ without errors.

---

## Git commits

```
feat(api): add FastAPI bridge wrapping existing Python services
feat(frontend): bootstrap React + shadcn/ui + Tailwind project
feat(frontend): implement AppLayout with sidebar navigation
feat(frontend): implement Login and SetupWizard screens
feat(frontend): implement Dashboard with recharts charts
feat(frontend): implement Orders two-panel with order form
feat(frontend): implement Customers, Filament, Printers screens
feat(frontend): implement Expenses, Failures, Settings screens
chore(make): add api / frontend / dev Makefile targets
```
