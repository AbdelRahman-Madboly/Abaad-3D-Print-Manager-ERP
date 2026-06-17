# Abaad ERP

> Full-stack ERP for 3D-printing service businesses.
> Manage orders, customers, filament, printers, expenses, and finances — all in one locally-hosted application.

[![Version](https://img.shields.io/badge/version-6.0.0-blue)](https://github.com/AbdelRahman-Madboly/Abaad-3D-Print-Manager-ERP/releases)
[![Python](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/)
[![Node](https://img.shields.io/badge/node-20%2B-green)](https://nodejs.org/)
[![CI](https://github.com/AbdelRahman-Madboly/Abaad-3D-Print-Manager-ERP/actions/workflows/ci.yml/badge.svg)](https://github.com/AbdelRahman-Madboly/Abaad-3D-Print-Manager-ERP/actions)
[![License](https://img.shields.io/badge/license-Proprietary-red)](#license)

---

## What is Abaad ERP?

Abaad ERP is a self-hosted management system for 3D-printing shops. It runs entirely on your own machine — no cloud, no subscription — and covers the complete business workflow:

- **Take orders** from quote to delivery, with per-gram pricing and PDF generation
- **Track filament inventory** across multiple spools and materials
- **Monitor printers** — depreciation, nozzle wear, electricity costs
- **Log expenses and print failures** with detailed cost tracking
- **Dashboard** with live revenue, profit margin, and inventory alerts

---

## Screenshots

| Login | Dashboard | Orders |
|-------|-----------|--------|
| *(run `make dev` and open `http://localhost:5173`)* | | |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Database | SQLite (WAL mode) |
| Backend services | Python 3.10+ |
| PDF generation | ReportLab |
| API bridge | FastAPI + Uvicorn |
| Frontend | React 18, TypeScript, Vite 6 |
| UI components | shadcn/ui (Radix UI + Tailwind CSS v4) |
| Charts | Recharts |
| Icons | Lucide React |
| Package manager | pnpm |

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 20+ |
| pnpm | 8+ (`npm install -g pnpm`) |

### 1 — Clone and install

```bash
git clone https://github.com/AbdelRahman-Madboly/Abaad-3D-Print-Manager-ERP.git
cd Abaad-3D-Print-Manager-ERP

# Python backend
pip install -e ".[api]"

# React frontend
make frontend-install
```

### 2 — Start the app

```bash
make dev
```

This starts two processes concurrently:
- **FastAPI bridge** at `http://localhost:8000`
- **React frontend** at `http://localhost:5173`

### 3 — Open your browser

```
http://localhost:5173
```

**Default credentials:** `admin` / `admin123`

On first launch the **Setup Wizard** walks you through company info, filament spools, and your primary printer.

---

## Project Structure

```
Abaad-3D-ERP/
├── src/                        Python backend
│   ├── auth/                   Auth manager and permissions
│   ├── core/                   config.py, database.py, models.py
│   ├── services/               Business logic (orders, customers, inventory,
│   │                           printers, finance, PDF, Cura import)
│   └── utils/                  Currency formatting helpers
│
├── api/                        FastAPI bridge (thin HTTP wrapper)
│   ├── main.py                 App factory, CORS, router registration
│   ├── deps.py                 Singleton service injection + session store
│   └── routers/                auth, orders, customers, filament, printers,
│                               expenses, failures, settings, dashboard
│
├── frontend/                   React application
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts          Typed fetch wrapper with Bearer-token injection
│   │   │   └── auth-context.tsx  React AuthContext
│   │   ├── app/
│   │   │   ├── components/     All screen components + shadcn/ui primitives
│   │   │   └── App.tsx         Root — AuthProvider + routing
│   │   └── styles/             Tailwind theme, fonts, globals
│   └── vite.config.ts          /api proxy → localhost:8000
│
├── data/                       abaad_v5.db (SQLite, gitignored), backups/
├── exports/                    Generated PDFs
├── tests/                      pytest suite (199 passing, 1 skipped)
├── docs/                       Developer docs, phase reports
├── Makefile
├── launch.sh                   Linux launcher (Tkinter legacy)
└── Launch_App.bat              Windows launcher (Tkinter legacy)
```

---

## Features

### Orders
- Full status lifecycle: **Draft → Quote → Confirmed → In Progress → Ready → Delivered**
- Per-item pricing: weight (g) × rate (EGP/g) × quantity
- Tolerance discount, R&D mode (cost-price only), order-level percentage discount
- Payment methods: Cash, Vodafone Cash (0.5% fee), InstaPay (0.1% fee)
- One-click **Quote PDF** and **Receipt PDF** download

### Filament Inventory
- Track multiple spools: brand, type, color, initial and current weight
- Trash / restore spools without permanent deletion
- Low-stock warnings and per-spool remaining percentage

### Customer Management
- Phone-number deduplication
- Per-customer discount percentage
- Full order history per customer
- Lifetime orders count and total spend

### Printer Tracking
- Cost per gram: depreciation + electricity + nozzle wear
- Nozzle wear tracking with reset action
- Active/inactive toggle

### Finance
- **Expenses** — categorised log (Bills, Filament, Maintenance, Packaging, etc.)
- **Print Failures** — waste cost calculator (filament + time + materials)
- **Dashboard** — revenue, gross profit, margin, order status breakdown, inventory alerts

### Settings
- Company name, subtitle, phone, address, tagline, social handle
- Default rate and cost per gram, deposit %, quote validity, next order number
- Changes reflected immediately on generated PDFs

---

## Makefile Reference

```bash
make dev               # Start FastAPI (:8000) + Vite (:5173) concurrently
make api               # FastAPI bridge only
make frontend          # Vite dev server only
make frontend-install  # pnpm install
make frontend-build    # Production build → frontend/dist/
make test              # Run pytest suite
make lint              # Run ruff linter
make run               # Launch legacy Tkinter app
make build             # Build PyInstaller bundle (Linux)
make install           # pip install -e ".[dev]"
make clean             # Remove build artifacts
```

---

## API Reference

Full interactive docs available at `http://localhost:8000/docs` when running.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate; returns Bearer token |
| `POST` | `/api/auth/logout` | Invalidate session |
| `GET` | `/api/orders` | List orders (`?status=&search=`) |
| `POST` | `/api/orders` | Create order |
| `PUT` | `/api/orders/{id}` | Update order |
| `GET` | `/api/orders/{id}/pdf/quote` | Download quote PDF |
| `GET` | `/api/orders/{id}/pdf/receipt` | Download receipt PDF |
| `GET` | `/api/customers` | List customers (`?search=`) |
| `POST` | `/api/customers` | Create customer |
| `PUT` | `/api/customers/{id}` | Update customer |
| `DELETE` | `/api/customers/{id}` | Delete customer |
| `GET` | `/api/filament` | List spools |
| `POST` | `/api/filament` | Add spool |
| `PUT` | `/api/filament/{id}` | Update spool |
| `POST` | `/api/filament/{id}/trash` | Trash / restore spool |
| `GET` | `/api/printers` | List printers |
| `POST` | `/api/printers` | Add printer |
| `PUT` | `/api/printers/{id}` | Update printer |
| `POST` | `/api/printers/{id}/reset-nozzle` | Reset nozzle usage counter |
| `GET` | `/api/expenses` | List expenses (`?category=`) |
| `POST` | `/api/expenses` | Add expense |
| `PUT` | `/api/expenses/{id}` | Update expense |
| `DELETE` | `/api/expenses/{id}` | Delete expense |
| `GET` | `/api/failures` | List failures (`?reason=&source=`) |
| `POST` | `/api/failures` | Log failure |
| `DELETE` | `/api/failures/{id}` | Delete failure |
| `GET` | `/api/settings` | Get all settings |
| `POST` | `/api/settings` | Save settings |
| `GET` | `/api/dashboard/summary` | KPIs + charts (`?period=week\|month\|year`) |

---

## Architecture

```
Browser
  └── http://localhost:5173  (Vite / React SPA)
           │  fetch /api/*
  └── http://localhost:8000  (FastAPI bridge)
           │  Python imports
        src/services/        (all business logic)
           │
        SQLite               data/abaad_v5.db
```

**Design rules:**
- React components call the API only — no business logic in the frontend
- FastAPI routers are thin — they delegate entirely to `src/services/`
- Services contain all business rules — no SQL in route handlers
- `src/core/config.py` is the single source of truth for all constants

---

## Data & Backups

| Item | Location |
|------|----------|
| Database | `data/abaad_v5.db` (SQLite WAL, gitignored) |
| Automatic backups | `data/backups/` |
| Generated PDFs | `exports/` |

To back up manually:

```bash
python -c "from src.core.database import get_database; get_database().backup_database()"
```

---

## Running Tests

```bash
make test
# or
python3 -m pytest -q
```

199 tests pass against an in-memory SQLite database. No live data required.

---

## User Guide

See **[docs/USER-GUIDE.md](docs/USER-GUIDE.md)** for a full walkthrough of every screen.

---

## Contributing

See **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** for branch strategy and commit conventions.

---

## License

Private — internal business software. Not for redistribution.
