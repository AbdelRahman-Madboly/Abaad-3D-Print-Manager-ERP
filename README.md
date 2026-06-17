# Abaad ERP — 3D Printing Business Management System

> Full-stack ERP for 3D-printing service businesses.
> Python backend · React + shadcn/ui frontend · SQLite database · PDF generation.

---

## Overview

Abaad ERP is a desktop management system built for 3D-printing shops. It handles the full business workflow — from customer orders and filament inventory through to PDF invoices and financial reporting — in a single, locally-hosted application.

**Two layers:**
- **Python backend** (`src/`) — business logic, SQLite database, PDF generation, Cura G-code import
- **React frontend** (`frontend/`) — modern shadcn/ui interface served at `localhost:5173`, talking to a FastAPI bridge at `localhost:8000`

**Platform targets:** Ubuntu 24.04 (primary), Windows 10/11 (secondary).

---

## Features

### Orders
- Full lifecycle: **Draft → Quote → Confirmed → In Progress → Ready → Delivered**
- Per-item pricing based on weight (EGP/g), quantity, and rate override
- Tolerance discount, R&D mode (cost-only), order-level percentage discount
- Payment methods: Cash, Vodafone Cash (0.5% fee), InstaPay (0.1% fee)
- One-click **Quote PDF** and **Receipt PDF** generation

### Filament Inventory
- Standard (1 kg) and Remaining (partial) spool types
- Pending reservation system — prevents double-booking
- Low-stock warnings below 15% remaining

### Customer Management
- Phone-number deduplication
- Per-customer discount, lifetime spend, order history

### Printer Tracking
- Depreciation per gram printed
- Nozzle wear tracking with auto-increment after 1,500 g
- Full cost breakdown per printer (depreciation + electricity + nozzle)

### Finance
- Expense log with category filters
- Print failure log with waste cost calculation
- Dashboard: revenue, profit, margin, active spools, pending orders

### Users & Permissions
- Admin (full access) and User (orders + customers + inventory view) roles

### Cura Integration
- Import print time and filament weight from `.gcode` files
- Optional OCR from Cura screenshots (requires Tesseract)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+, SQLite (WAL mode), ReportLab |
| API bridge | FastAPI + Uvicorn |
| Frontend | React 18, TypeScript, Vite 6 |
| UI components | shadcn/ui (Radix UI + Tailwind CSS v4) |
| Charts | Recharts |
| Icons | Lucide React |

---

## Project Structure

```
Abaad-3D-ERP/
├── src/                    Python backend (business logic + DB layer)
│   ├── auth/               auth_manager.py, permissions.py
│   ├── core/               config.py, database.py, models.py
│   ├── services/           order, customer, inventory, printer, finance, pdf, cura
│   ├── ui/                 Tkinter UI (legacy — replaced by React in Phase 10)
│   └── utils/              helpers.py
├── frontend/               React + shadcn/ui web frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ AppLayout, Dashboard, Orders, Customers, Filament,
│   │   │   │               Printers, Expenses, Failures, Settings, Login,
│   │   │   │               SetupWizard, ItemDialog
│   │   │   └── App.tsx
│   │   ├── styles/         theme.css, globals.css, fonts.css
│   │   └── main.tsx
│   ├── public/             favicon.svg, logo.png
│   ├── package.json
│   └── vite.config.ts
├── api/                    FastAPI bridge (thin HTTP wrapper over src/services/)
│   ├── main.py
│   └── routers/            orders, customers, filament, printers,
│                           expenses, failures, settings, auth
├── assets/                 Abaad.png, logo_custom.png, Print3D_Manager.ico
├── data/                   abaad_v5.db (SQLite, gitignored), backups/
├── exports/                Generated PDFs and CSV exports
├── tests/                  pytest suite (199 passing)
├── main.py                 Python entry point (Tkinter app)
├── Makefile
├── launch.sh               Linux launcher
└── Launch_App.bat          Windows launcher
```

---

## Quick Start

### Option A — Python desktop app (Tkinter)

**Requirements:** Python 3.10+

```bash
git clone https://github.com/AbdelRahman-Madboly/Abaad-3D-Print-Manager-ERP
cd Abaad-3D-Print-Manager-ERP

# Linux / macOS
chmod +x setup.sh && ./setup.sh
./launch.sh

# Windows
SETUP.bat
Launch_App.bat
```

### Option B — React web frontend (Phase 10)

**Requirements:** Python 3.10+, Node.js 18+, pnpm

```bash
# 1. Install Python dependencies
pip install -e ".[dev]"
pip install fastapi uvicorn

# 2. Install frontend dependencies
make frontend-install

# 3. Start both API (port 8000) and React (port 5173)
make dev
```

Then open `http://localhost:5173` in your browser.

#### Individual services

```bash
make api        # FastAPI bridge only — port 8000
make frontend   # Vite dev server only — port 5173
```

---

## Running Tests

```bash
make test
# or
python3 -m pytest -q
```

The full test suite covers all services against an in-memory SQLite database.

---

## First-Time Setup

1. Launch the app (either Tkinter or React).
2. Log in with the default admin credentials.
3. The **Setup Wizard** runs automatically on a fresh database — fill in your company name, logo, initial filament spools, and primary printer.
4. Start taking orders.

---

## Configuration

### Company information
Configured via **Settings → Company Information** (or the setup wizard). Appears on all generated PDFs.

### Pricing defaults (`src/core/config.py`)

| Constant | Default | Description |
|----------|---------|-------------|
| `DEFAULT_RATE_PER_GRAM` | 4.00 EGP | Selling price per gram |
| `DEFAULT_COST_PER_GRAM` | 0.84 EGP | Material cost per gram |
| `SPOOL_PRICE_FIXED` | 840.00 EGP | 1 kg eSUN PLA+ spool |
| `ELECTRICITY_RATE` | 0.31 EGP/hr | Electricity cost |
| `DEFAULT_PRINTER_PRICE` | 25,000 EGP | Printer purchase price |
| `NOZZLE_COST` | 100.00 EGP | Per nozzle |
| `NOZZLE_LIFETIME_GRAMS` | 1,500 g | Grams printed per nozzle |

---

## Makefile Targets

| Target | Description |
|--------|-------------|
| `make run` | Run the Tkinter desktop app |
| `make dev` | Start both API and React frontend concurrently |
| `make api` | Start FastAPI bridge on port 8000 |
| `make frontend` | Start Vite dev server on port 5173 |
| `make frontend-install` | Install frontend npm dependencies via pnpm |
| `make frontend-build` | Build React app for production |
| `make test` | Run the full pytest suite |
| `make lint` | Run ruff linter |
| `make build` | Build PyInstaller bundle (Linux) |
| `make install` | Install Python package in editable mode |
| `make clean` | Remove build artifacts |

---

## Data & Backups

| Item | Location |
|------|----------|
| Database | `data/abaad_v5.db` (SQLite WAL, gitignored) |
| Automatic backups | `data/backups/` |
| Generated PDFs | `exports/` |

**Backup:** Settings → Data Management → Backup Database, or:
```bash
python -c "from src.core.database import get_database; get_database().backup_database()"
```

---

## API Reference

The FastAPI bridge exposes REST endpoints at `http://localhost:8000`:

```
POST   /api/auth/login            Authenticate and receive JWT
GET    /api/auth/me               Current user info

GET    /api/orders                List orders (?status=&search=)
POST   /api/orders                Create order
PUT    /api/orders/{id}           Update order
GET    /api/orders/{id}/pdf/quote Download quote PDF
GET    /api/orders/{id}/pdf/receipt Download receipt PDF

GET    /api/customers             List customers (?search=)
POST   /api/customers             Create customer
PUT    /api/customers/{id}        Update customer
DELETE /api/customers/{id}        Delete customer

GET    /api/filament              List spools
POST   /api/filament              Add spool
PUT    /api/filament/{id}         Update spool

GET    /api/printers              List printers
POST   /api/printers              Add printer
PUT    /api/printers/{id}         Update printer

GET    /api/expenses              List expenses (?category=&month=)
POST   /api/expenses              Add expense
DELETE /api/expenses/{id}         Delete expense

GET    /api/failures              List failures (?reason=&source=)
POST   /api/failures              Log failure
DELETE /api/failures/{id}         Delete failure

GET    /api/settings              Get all settings
POST   /api/settings              Save settings

GET    /api/dashboard/summary     Dashboard KPIs (?period=week|month|year)
```

---

## Architecture

```
React Frontend (port 5173)
        │ HTTP /api/*
FastAPI Bridge (port 8000)
        │ imports
Python Services (src/services/)
        │
DatabaseManager (src/core/database.py)
        │
SQLite (data/abaad_v5.db)
```

**Rules:**
- UI components call the API only — no business logic in React
- FastAPI routers delegate entirely to existing Python services
- Services contain all business rules — no SQL in routes
- `config.py` is the single source of truth for all constants

---

## Keyboard Shortcuts (Tkinter app)

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New order |
| `Ctrl+S` | Save current form |
| `Ctrl+F` | Focus search |
| `F5` | Refresh all tabs |
| `Escape` | Clear selection |

---

## License

Private — internal business software. Not for redistribution.
