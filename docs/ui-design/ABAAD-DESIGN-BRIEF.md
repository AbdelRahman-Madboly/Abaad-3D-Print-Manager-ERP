# Abaad ERP — UI/UX Design Brief
> Feed this file into Figma (or your Figma AI plugin) to generate the full
> React component tree. The output replaces the current Tkinter UI with a
> modern React + shadcn/ui + Tailwind desktop-web interface.

---

## Product context

**Abaad ERP** is a desktop management system for 3D-printing service businesses.
It is used by the shop owner (admin) and optionally staff members (user role) to
manage orders, customers, filament inventory, printers, expenses, and failures.

**Two identities:**
- **Product** = Abaad (appears only in footer credit and About screen)
- **Tenant** = the shop's own brand (logo, name, and subtitle — configured at first run)

**Target platform:** Ubuntu 24.04 primary, Windows 10/11 secondary.
The React build will be served locally (Electron or Tauri shell) or as a
local web app — no cloud, no auth server.

---

## Design language

### Colors (from current `theme.py` — keep exact hex values)

| Token | Hex | Use |
|-------|-----|-----|
| `primary` | `#1e3a8a` | Nav active, primary buttons, table headers |
| `primary-dark` | `#1d4ed8` | Button hover |
| `primary-light` | `#3b82f6` | Accents, selected rows |
| `primary-lighter` | `#60a5fa` | Light accents |
| `success` | `#10b981` | Profit values, "Ready" status badges |
| `danger` | `#ef4444` | Delete buttons, "Cancelled", warnings |
| `warning` | `#f59e0b` | "Pending payment", low-stock alerts |
| `info` | `#06b6d4` | Informational badges |
| `purple` | `#7c3aed` | Admin role badge, R&D project tag |
| `bg` | `#f8fafc` | Page background |
| `card` | `#ffffff` | Card/surface background |
| `text` | `#0f172a` | Primary text |
| `text-secondary` | `#64748b` | Labels, secondary info |
| `text-muted` | `#cbd5e1` | Placeholder, empty states |
| `border` | `#e2e8f0` | Card borders, dividers |
| `bg-dark` | `#1e293b` | Sidebar, login header |

### Typography

- Font: **Inter** (replaces system font; fallback: `system-ui`)
- Scale: 12 / 13 / 14 / 16 / 20 / 24 px
- Weight: 400 (body), 500 (label), 600 (section header), 700 (page title, big numbers)

### Spacing & radius

- Base unit: 4 px grid
- Card radius: `rounded-xl` (12 px)
- Button radius: `rounded-md` (6 px)
- Input radius: `rounded-md` (6 px)
- Card shadow: `shadow-sm` (subtle)

### Icon style

Use **Lucide React** icons throughout (replaces emoji icons in the current UI).

---

## Application layout

### Shell — `AppLayout.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR (240 px, bg-dark)          CONTENT AREA (flex-1, bg)   │
│  ┌──────────────────────┐           ┌──────────────────────────┐ │
│  │  [Logo]  Tenant Name │           │  <PageHeader />          │ │
│  │  Tenant Subtitle     │           │  <PageContent />         │ │
│  │  ─────────────────── │           │                          │ │
│  │  📊 Dashboard        │           │                          │ │
│  │  📦 Orders           │           │                          │ │
│  │  👥 Customers        │           │                          │ │
│  │  🧵 Filament         │           │                          │ │
│  │  🖨  Printers         │           │                          │ │
│  │  💸 Expenses         │           │                          │ │
│  │  ⚠️  Failures         │           │                          │ │
│  │  ──────────────────  │           │                          │ │
│  │  ⚙️  Settings         │           │                          │ │
│  │  ─────────────────── │           │                          │ │
│  │  [Avatar] Admin User │           │                          │ │
│  │  [Logout]            │           └──────────────────────────┘ │
│  └──────────────────────┘                                        │
│                              STATUS BAR (full width, 28 px)      │
│    Filament: 3 active  |  Orders: 5 pending  |  Clock  [User]   │
└─────────────────────────────────────────────────────────────────┘
```

**Sidebar nav items:**

| Icon (Lucide) | Label | Route |
|---------------|-------|-------|
| `LayoutDashboard` | Dashboard | `/` |
| `Package` | Orders | `/orders` |
| `Users` | Customers | `/customers` |
| `Layers` | Filament | `/filament` |
| `Printer` | Printers | `/printers` |
| `Receipt` | Expenses | `/expenses` |
| `AlertTriangle` | Failures | `/failures` |
| `Settings` | Settings | `/settings` |

---

## Screens

---

### 1. Login — `Login.tsx`

**Purpose:** Authenticate the user before showing the app.

```
┌───────────────────────────────────────────────────────┐
│         bg-dark header (full width, 120 px)            │
│         [Tenant Logo]  Tenant Name                     │
│         "3D Printing Services"                         │
├───────────────────────────────────────────────────────┤
│                                                        │
│    ┌─────────────── Card (400 px) ──────────────────┐  │
│    │  Sign In                                        │  │
│    │  ─────────────────────────────────────────────  │  │
│    │  Username  [________________________]           │  │
│    │  Password  [________________________] [👁]      │  │
│    │  [ ] Show password                              │  │
│    │                                                 │  │
│    │  [error message — red, hidden when empty]      │  │
│    │                                                 │  │
│    │  [         Sign In (primary button)         ]   │  │
│    │                                                 │  │
│    │  Quick select (only shown when >1 user):        │  │
│    │  [Admin]  [Staff Name]  …                       │  │
│    └─────────────────────────────────────────────────┘  │
│                                                        │
│    "Generated by Abaad ERP"  (footer, muted, small)    │
└───────────────────────────────────────────────────────┘
```

**Components:** `Input`, `Button`, `Card`, `Label`, `Checkbox`

---

### 2. Setup Wizard — `SetupWizard.tsx`

**Purpose:** First-run 4-step configuration. Shown once; skippable per-step.

```
┌───────────────────────────────────────────────────────┐
│  Welcome to Abaad ERP      Step N of 4                 │
│  ── ●──○──○──○  (step progress dots)                   │
├───────────────────────────────────────────────────────┤
│                                                        │
│    STEP 1 — Company Info                               │
│    ┌───────────────────────────────────────────────┐   │
│    │  Company Name *        [__________________]   │   │
│    │  Subtitle              [__________________]   │   │
│    │  Phone                 [__________________]   │   │
│    │  Address               [__________________]   │   │
│    │  Tagline               [__________________]   │   │
│    │  Social Handle         [__________________]   │   │
│    │  Logo        [Browse…] [preview thumbnail]    │   │
│    └───────────────────────────────────────────────┘   │
│                                                        │
│    STEP 2 — Filament Spools (checkboxes by color)      │
│    STEP 3 — Primary Printer                            │
│    STEP 4 — Cost Defaults (review & confirm)           │
│                                                        │
│    [← Back]  [Skip step]  [Close]  [Next / Finish →]  │
└───────────────────────────────────────────────────────┘
```

**Step 2 — Filament:** grid of color checkboxes with swatches; initial weight input per checked color.

**Step 3 — Printer form:** Name, Model, Purchase Price, Electricity kWh rate, Nozzle cost, Nozzle life (grams).

**Step 4 — Cost review:** read-only summary of rate/gram, cost/gram, deposit %, quote validity; editable.

**Components:** `Dialog` (modal), `Progress`, `Checkbox`, `Input`, `Select`, `Button`

---

### 3. Dashboard — `Dashboard.tsx`

```
┌──── Page header ────────────────────────────────────────────────┐
│  📊 Dashboard          Period: [This Month ▼]  [🔄 Refresh]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ACTION CENTER                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ ⏰ Overdue   │  │ 💳 Unpaid    │  │ 🔩 Nozzle    │           │
│  │  N orders    │  │  N orders    │  │  N printers  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  OVERVIEW — KPI STAT CARDS                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │
│  │ Revenue    │ │ Profit     │ │ Orders     │ │ Filament   │    │
│  │ 12,400 EGP │ │ 4,800 EGP  │ │ 38 orders  │ │ 3 active   │   │
│  │ ↑ vs prev  │ │ 38% margin │ │            │ │ spools     │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │
│                                                                  │
│  CHARTS (tab switcher: Revenue | Filament Usage | Order Status)  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  [Revenue] [Filament] [Orders]                            │   │
│  │                                                           │   │
│  │  Bar chart / Pie chart (recharts)                         │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  PRINTER UTILIZATION                                             │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │ Printer 1          │  │ Printer 2          │                  │
│  │ Lifetime  ████░ 73%│  │ Lifetime  ██░░ 40%│                  │
│  │ Nozzle    ████░ 80%│  │ Nozzle    █░░░ 20%│                  │
│  └────────────────────┘  └────────────────────┘                  │
│                                                                  │
│  DETAILED BREAKDOWNS (Revenue by Customer | Expenses by Cat.)    │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ Revenue by Customer  │  │ Expenses by Category  │             │
│  │  [mini colored cards]│  │  [mini colored cards] │             │
│  └──────────────────────┘  └──────────────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

**Components:** `StatCard`, `AlertCard`, `Tabs`, `Progress`, `Badge`, recharts `BarChart`/`PieChart`

---

### 4. Orders — `Orders.tsx`

Two-panel layout (list left, order form right).

```
┌── LEFT PANEL (420 px) ─────┬── RIGHT PANEL (flex-1) ──────────────┐
│  📦 Orders                 │  📝 New Order / Edit Order            │
│  [➕ New Order]             │                                       │
│  ──────────────────────    │  CUSTOMER                             │
│  🔍 [search...]            │  Name [___________] Phone [_________] │
│  Status [All ▼]            │  [🔍 Lookup]                          │
│  ────────────────────────  │  Status [Dropdown] [ ] R&D Project    │
│  ┌──────────────────────┐  │                                       │
│  │ #001  Customer Name  │  │  PRINT ITEMS                          │
│  │ In Progress  240 EGP │  │  [➕ Item] [✏ Edit] [🗑 Remove]       │
│  │ 2026-06-10           │  │  ┌───────────────────────────────┐    │
│  ├──────────────────────┤  │  │ Name | Weight | Time | Cost  │    │
│  │ #002  …              │  │  │ …                             │    │
│  │ …                    │  │  └───────────────────────────────┘    │
│  └──────────────────────┘  │                                       │
│                             │  PAYMENT & TOTALS                    │
│  (scrollable order list)    │  Base: 0.00   Actual: 0.00           │
│                             │  Discount: 0%  (-0.00)               │
│                             │  Order disc %: [___]  Tolerance [__] │
│                             │  Payment: [Cash ▼]  Fee: 0.00        │
│                             │  Ship: [__]                          │
│                             │  Received: [___]  Rounding: 0.00     │
│                             │  TOTAL: 0.00 EGP   Profit: 0.00      │
│                             │                                       │
│                             │  [💾 Save] [🧾 Quote PDF]            │
│                             │  [🧾 Receipt PDF] [🗑 Delete]        │
└─────────────────────────────┴───────────────────────────────────────┘
```

**Order list card:** order number, customer name, status badge (color-coded), total, date.

**Status badge colors:**
| Status | Color |
|--------|-------|
| Draft | `text-muted` gray |
| Quote | `warning` amber |
| Confirmed | `info` cyan |
| In Progress | `primary-light` blue |
| Ready | `success` green |
| Delivered | `success-dark` dark green |
| Cancelled | `danger` red |

**Item dialog (`ItemDialog.tsx`):** modal for adding/editing a print item — Name, Color (dropdown), Weight (g), Infill (%), Supports, Print time (h:m), Cost override.

**Components:** `Card`, `Badge`, `Input`, `Select`, `Button`, `Table`, `Dialog`, `Separator`

---

### 5. Customers — `Customers.tsx`

Two-panel layout.

```
┌── LEFT (380 px) ──────────┬── RIGHT (flex-1) ──────────────────────┐
│  👥 Customers             │  👤 Customer Details                    │
│  [➕ Add]  [✏ Edit]       │                                         │
│  [🗑 Delete]              │  Name:     John Doe                     │
│  ──────────────────────── │  Phone:    01012345678                  │
│  🔍 [search...]           │  Email:    john@example.com             │
│                            │  Address:  123 St, Cairo               │
│  ┌──────────────────────┐ │  Notes:    VIP customer                 │
│  │ Name      │ Orders   │ │                                         │
│  │ Phone     │ Spent    │ │  STATS                                  │
│  ├───────────┼──────────┤ │  ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │ John Doe  │ 5        │ │  │ Orders:5 │ │Total:800 │ │Avg:160 │  │
│  │ 010xxx    │ 800 EGP  │ │  └──────────┘ └──────────┘ └────────┘  │
│  └──────────────────────┘ │                                         │
│  12 customers              │  ORDER HISTORY                         │
│                            │  ┌──────────────────────────────────┐  │
│                            │  │ # | Status | Total | Date       │  │
│                            │  └──────────────────────────────────┘  │
└────────────────────────────┴────────────────────────────────────────┘
```

**Components:** `Table`, `Input`, `Button`, `Card`, `Badge`, `Separator`

---

### 6. Filament — `Filament.tsx`

```
┌── TOOLBAR ──────────────────────────────────────────────────────────┐
│  🧵 Filament Inventory                                               │
│  [➕ Standard Spool] [➕ Remaining] [🎨 Colors] [🗑 Trash] [✏ Edit] │
│  Show: [Active ▼]   🔍 [search...]                    [🔄 Refresh] │
├─────────────────────────────────────────────────────────────────────┤
│  INVENTORY SUMMARY                                                   │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐              │
│  │ Total Weight  │ │ Available     │ │ Active Spools │              │
│  │ 7,000 g       │ │ 6,400 g       │ │ 7 spools      │              │
│  └───────────────┘ └───────────────┘ └───────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Color │ Brand │ Type │ Total │ Remaining │ %     │ Status    │   │
│  ├───────┼───────┼──────┼───────┼───────────┼───────┼───────────┤   │
│  │ ■ Black│ eSUN │ PLA  │1000g  │  870g     │ 87%   │ [Active]  │   │
│  │ ■ Blue │ eSUN │ PLA  │1000g  │  110g     │ 11%   │ [Low ⚠]   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Spool row:** color swatch square (16×16 px, actual color from DB), progress bar in "%" column.

**Low stock threshold:** < 15% → `warning` amber badge. Trash → `danger` red.

**Spool form dialog:** Color (dropdown with swatches), Brand, Type (PLA/PETG/ABS/etc.), Weight (g), Remaining (g), Purchase Price, Notes.

**Color manager dialog:** list of colors + hex pickers; add/remove colors.

**Components:** `Table`, `Progress`, `Badge`, `Dialog`, `Input`, `Select`, `ColorPicker`, `Button`

---

### 7. Printers — `Printers.tsx`

Two-panel layout.

```
┌── LEFT (360 px) ─────────┬── RIGHT (flex-1) ──────────────────────┐
│  🖨 Printers             │  🖨 Printer Info                        │
│  [➕ Add] [✏ Edit]       │                                         │
│  [🔧 Reset Nozzle]       │  Name:        Printer 1                 │
│  ──────────────────────  │  Model:       Bambu X1C                 │
│  ┌─────────────────────┐ │  Purchase:    15,000 EGP                │
│  │ Name   │ Model      │ │  Power:       0.4 kWh                   │
│  │ Printed│ Status     │ │                                         │
│  ├────────┼────────────┤ │  COST BREAKDOWN                         │
│  │ P1     │ Bambu X1C  │ │  ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ 1.2 kg │ [Active]   │ │  │Deprec/g  │ │Electric/g│ │Nozzle/g │ │
│  └─────────────────────┘ │  └──────────┘ └──────────┘ └─────────┘ │
│                           │                                         │
│                           │  NOZZLE WEAR                           │
│                           │  Nozzle Usage:  ████████░░  82%        │
│                           │  [progress bar — warning color >80%]   │
│                           │  Used: 820 g / 1000 g life             │
└───────────────────────────┴─────────────────────────────────────────┘
```

**Components:** `Table`, `Progress`, `Card`, `Badge`, `Button`, `Dialog`, `Input`

---

### 8. Expenses — `Expenses.tsx`

```
┌── TOOLBAR ──────────────────────────────────────────────────────────┐
│  💸 Expenses                                                         │
│  [➕ Add] [✏ Edit] [🗑 Delete]                                       │
│  Category [All ▼]  Month [All ▼]  [🔍 Filter]  [🔄 Reset]          │
├─────────────────────────────────────────────────────────────────────┤
│  EXPENSE SUMMARY (colored stat cards)                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ Total        │ │ Rent         │ │ Utilities    │ │ Supplies   │ │
│  │ 3,200 EGP    │ │ 1,500 EGP    │ │  400 EGP     │ │  800 EGP   │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Date │ Category │ Name │ Qty │ Unit Price │ Total │ Notes   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Expense categories:** Rent, Utilities, Supplies, Maintenance, Salary, Marketing, Other.

**Components:** `Table`, `Select`, `Button`, `Dialog`, `Input`, `DatePicker`, `Badge`

---

### 9. Failures — `Failures.tsx`

```
┌── TOOLBAR ──────────────────────────────────────────────────────────┐
│  ⚠️ Print Failures                                                   │
│  [➕ Log Failure]  [🗑 Delete]                                        │
│  Reason [All ▼]  Source [All ▼]  [🔍 Filter]  [🔄 Reset]           │
├─────────────────────────────────────────────────────────────────────┤
│  FAILURE SUMMARY                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │
│  │ Total        │ │ Filament Lost│ │ Time Lost    │                 │
│  │ 12 failures  │ │   340 g      │ │  18 h        │                 │
│  └──────────────┘ └──────────────┘ └──────────────┘                 │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Date │ Reason │ Source │ Filament (g) │ Time (min) │ Est.Cost│  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

**Failure reasons:** Nozzle Clog, Bed Adhesion, Layer Shift, Filament Tangle, Power Outage, Stringing, Warping, Under Extrusion, Over Extrusion, Broken Part, Wrong Settings, Filament Ran Out, Machine Error, Other.

**Source:** Manual entry, Order (linked to an order ID).

**Components:** `Table`, `Select`, `Button`, `Dialog`, `Input`, `Badge`

---

### 10. Settings — `Settings.tsx`

Scrollable single-column form, grouped into sections.

```
┌── Settings ─────────────────────────────────────────────────────────┐
│  [💾 Save All Settings]                                              │
│                                                                      │
│  ┌── 🏢 Company Information ──────────────────────────────────────┐  │
│  │  Company Name *   [_______________________]                    │  │
│  │  App Subtitle     [_______________________]                    │  │
│  │  Subtitle         [_______________________]                    │  │
│  │  Phone            [_______________________]                    │  │
│  │  Address          [_______________________]                    │  │
│  │  Tagline          [_______________________]                    │  │
│  │  Social Handle    [_______________________]                    │  │
│  │  Logo File        [Browse…]  [logo preview, 60×60 px]          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌── 💰 Pricing Defaults ─────────────────────────────────────────┐  │
│  │  Rate per gram (EGP)    [____]                                  │  │
│  │  Cost per gram (EGP)    [____]                                  │  │
│  │  Electricity rate       [____]                                  │  │
│  │  Currency symbol        [____]  (e.g. EGP, USD, SAR)           │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌── 📄 Quote & Invoice ──────────────────────────────────────────┐  │
│  │  Deposit %         [____]                                       │  │
│  │  Quote validity    [____] days                                  │  │
│  │  Next order #      [____]                                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌── 🗄 Data Management ──────────────────────────────────────────┐  │
│  │  [💾 Backup Database]  [📤 Export to CSV]                       │  │
│  │  status message                                                 │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌── ℹ About ─────────────────────────────────────────────────────┐  │
│  │  Abaad ERP  v5.0.0                                              │  │
│  │  "Generated by Abaad ERP"                                       │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

**Components:** `Input`, `Button`, `Card`, `Separator`, `Label`, `ScrollArea`

---

## Expected React file tree output (from Figma)

```
# File Tree: Abaad ERP Management System

├── guidelines
│   └── Guidelines.md
├── src
│   ├── app
│   │   ├── components
│   │   │   ├── figma
│   │   │   │   └── ImageWithFallback.tsx
│   │   │   ├── ui
│   │   │   │   ├── accordion.tsx
│   │   │   │   ├── alert.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── chart.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   └── utils.ts
│   │   │   ├── AppLayout.tsx        ← sidebar + status bar shell
│   │   │   ├── Login.tsx
│   │   │   ├── SetupWizard.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── ItemDialog.tsx       ← print item add/edit modal
│   │   │   ├── Customers.tsx
│   │   │   ├── Filament.tsx
│   │   │   ├── Printers.tsx
│   │   │   ├── Expenses.tsx
│   │   │   ├── Failures.tsx
│   │   │   └── Settings.tsx
│   │   ├── App.tsx
│   │   └── routes.ts
│   ├── imports
│   │   └── pasted_text
│   │       └── abaad-design-brief.md
│   ├── styles
│   │   ├── fonts.css
│   │   ├── globals.css
│   │   ├── index.css
│   │   ├── tailwind.css
│   │   └── theme.css
│   └── main.tsx
├── ATTRIBUTIONS.md
├── README.md
├── default_shadcn_theme.css
├── index.html
├── package.json
├── pnpm-workspace.yaml
├── postcss.config.mjs
└── vite.config.ts
```

---

## shadcn/ui theme overrides (`default_shadcn_theme.css`)

Map the Abaad color tokens to shadcn CSS variables:

```css
:root {
  --background: 210 40% 98%;        /* #f8fafc */
  --foreground: 222 84% 5%;         /* #0f172a */
  --card: 0 0% 100%;                /* #ffffff */
  --card-foreground: 222 84% 5%;
  --primary: 226 71% 34%;           /* #1e3a8a */
  --primary-foreground: 0 0% 100%;
  --secondary: 215 16% 47%;         /* #64748b */
  --secondary-foreground: 0 0% 100%;
  --muted: 213 31% 91%;             /* #e2e8f0 */
  --muted-foreground: 215 20% 65%;  /* #94a3b8 */
  --destructive: 0 84% 60%;         /* #ef4444 */
  --border: 214 32% 91%;            /* #e2e8f0 */
  --radius: 0.5rem;
}
```

---

## Guidelines for Figma (`guidelines/Guidelines.md`)

- All primary actions (Save, Confirm, Add) use `primary` filled button
- Destructive actions (Delete) use `danger` outlined button
- Neutral/secondary actions (Cancel, Back, Refresh) use ghost/outline button
- Every list view has a search bar and at least one filter dropdown
- Every list view shows a count label ("12 customers", "38 orders")
- Empty states: centered icon + message + primary CTA button (e.g. "No orders yet — Create your first order")
- Tables: striped rows (`bg/card` alternate), hover highlight (`card-hover`), selected row (`primary-lighter` with white text)
- Status badges: use `Badge` component with variant matching the status color map above
- Loading states: `Skeleton` component replacing content areas
- All modals: `Dialog` with max-width `480px`, scrollable body if content is tall
- Sidebar collapsed state (icon-only, 64 px wide) for smaller screens
- RTL-ready: all layouts use logical properties (`start`/`end` not `left`/`right`)
