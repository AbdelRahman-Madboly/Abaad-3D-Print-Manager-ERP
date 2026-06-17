# Abaad ERP — User Guide

Complete walkthrough for using Abaad ERP day-to-day.

---

## Table of Contents

1. [First-Time Setup](#1-first-time-setup)
2. [Logging In](#2-logging-in)
3. [Dashboard](#3-dashboard)
4. [Orders](#4-orders)
5. [Customers](#5-customers)
6. [Filament Inventory](#6-filament-inventory)
7. [Printers](#7-printers)
8. [Expenses](#8-expenses)
9. [Print Failures](#9-print-failures)
10. [Settings](#10-settings)
11. [Backing Up Your Data](#11-backing-up-your-data)
12. [Default Credentials](#12-default-credentials)

---

## 1. First-Time Setup

On the very first launch the **Setup Wizard** runs automatically.

### Step 1 — Company Information

Fill in your business details:

| Field | Example | Used in |
|-------|---------|---------|
| Company Name | Al-Nour 3D Printing | PDF header, login screen |
| Company Subtitle | Professional 3D Printing Services | PDF subheader |
| Phone | 01012345678 | PDF footer |
| Address | 15 El-Tahrir St, Cairo | PDF footer |
| Tagline | Quality Prints, Fast Delivery | PDF cover |
| Social Handle | @alnour3d | PDF footer |

### Step 2 — Initial Filament Inventory

Add the spools you have in stock right now. For each spool:

- **Name** — e.g. "eSUN PLA+ White"
- **Brand** — e.g. "eSUN"
- **Type** — PLA, PETG, ABS, TPU, etc.
- **Color**
- **Category** — Standard (1 kg) or Remaining (partial spool)
- **Initial weight** — full spool weight in grams (usually 1000 g)
- **Purchase price** — in EGP

### Step 3 — Primary Printer

Register your main printer:

- **Name / Model** — e.g. "Ender 3 Pro"
- **Purchase price** — used for depreciation calculation
- **Lifetime** (kg) — expected total grams before end-of-life (e.g. 100 kg)
- **Nozzle cost** — price of one nozzle in EGP
- **Nozzle lifetime** — grams printed per nozzle (default 1,500 g)
- **Electricity rate** — EGP per hour (check your electricity bill)

### Step 4 — Pricing Defaults

| Field | Meaning |
|-------|---------|
| Rate per gram | Selling price you charge customers (EGP/g) |
| Cost per gram | Your material cost (EGP/g) |
| Deposit % | Percentage required as upfront deposit on orders |
| Quote validity (days) | How many days a quote is valid |

Click **Complete Setup** — you will be taken to the main app.

---

## 2. Logging In

Open `http://localhost:5173` in your browser after running `make dev`.

Enter your username and password. Toggle the eye icon to show/hide the password.

**Default admin credentials:** `admin` / `admin123`

> Change the password after first login via Settings → Account.

---

## 3. Dashboard

The Dashboard shows a live overview of your business. Use the period selector (Week / Month / Year) to change the reporting window.

### KPI Cards (top row)

| Card | What it shows |
|------|---------------|
| Revenue | Total invoiced for delivered orders |
| Gross Profit | Revenue minus material + print costs |
| Profit Margin | Gross profit as a percentage of revenue |
| Total Orders | Order count for the period |
| Active Spools | Spools currently in stock (not trashed) |
| Total Expenses | Sum of all logged expenses |
| Failure Cost | Estimated waste from print failures |

### Alerts

Red/orange alert cards appear for:
- **Overdue orders** — Ready but not delivered after expected date
- **Unpaid orders** — Delivered but amount received is less than total
- **Nozzle alerts** — Printers with nozzle usage above 80%

Click any alert to navigate directly to the relevant order or printer.

### Charts

| Chart | How to read it |
|-------|---------------|
| Monthly Revenue | Bars: Revenue (blue) and Costs (red) per month |
| Order Status | Pie chart of current status distribution |
| Filament by Color | Bar chart of grams used per color |
| Expenses by Category | Bar chart of spend per category |

Click **Refresh** (top right) to reload all data.

---

## 4. Orders

### Order Lifecycle

```
Draft → Quote → Confirmed → In Progress → Ready → Delivered
```

| Status | Meaning |
|--------|---------|
| Draft | Work in progress, not shown to customer |
| Quote | Sent to customer for approval |
| Confirmed | Customer approved, work not yet started |
| In Progress | Printing now |
| Ready | Print complete, awaiting pickup / delivery |
| Delivered | Handed over to customer |

### Creating an Order

1. Click **New Order** (top right).
2. Fill in **Customer Name** and **Phone**.
3. Add print items with **Add Item**:
   - **Name** — what the part is called
   - **Weight (g)** — estimated filament weight
   - **Color** — filament color
   - **Infill %** — e.g. 20%
   - **Supports** — on or off
   - **Print time** — hours and minutes
4. Set payment options:
   - **Discount %** — order-level discount
   - **Shipping** — flat shipping fee
   - **Payment method** — Cash / Vodafone Cash / InstaPay
   - **Amount received** — deposit or full payment received
5. Toggle **R&D Project** if this is an internal project (no profit margin).
6. Click **Save**.

### Editing an Order

Click any order row to select it, then click **Edit** in the toolbar. All fields are editable until the order is Delivered.

### Changing Status

Select an order and use the **Status** dropdown in the toolbar.

### Downloading PDFs

With an order selected:
- **Quote PDF** — itemised quote with pricing, for the customer
- **Receipt PDF** — payment receipt after delivery

Files download directly to your browser's Downloads folder.

### Filtering Orders

Use the **Status** filter dropdown to show only orders in a specific state. Use the **Search** box to find by customer name or order number.

---

## 5. Customers

### Adding a Customer

Click **New Customer** and fill in:

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | |
| Phone | Yes | Must be unique — prevents duplicates |
| Email | No | |
| Address | No | |
| Discount % | No | Applied automatically to all orders for this customer |
| Notes | No | Internal notes |

### Customer Panel

Click a customer row to expand the detail panel on the right:
- **Lifetime stats** — total orders and total amount spent
- **Order history** — all past orders with status and totals

### Editing / Deleting

Select a customer and click **Edit** or **Delete** in the toolbar. Deleting a customer does not delete their orders.

---

## 6. Filament Inventory

### Adding a Spool

Click **Add Spool** and fill in:

| Field | Notes |
|-------|-------|
| Name | Descriptive name, e.g. "eSUN PLA+ White 1kg" |
| Brand | Manufacturer |
| Type | PLA / PETG / ABS / TPU / ASA / Resin |
| Color | |
| Category | Standard (1 kg) or Remaining (partial) |
| Initial weight (g) | Full spool weight — typically 1000 g |
| Current weight (g) | How much is left right now |
| Purchase price (EGP) | Cost of the spool |

### Reading the Spool List

| Column | Meaning |
|--------|---------|
| Remaining % | Current ÷ Initial weight |
| Available | Grams available (not reserved) |
| Status | Active / Low / Trashed |

A spool shows **Low** when remaining falls below 15%.

### Trashing a Spool

When a spool is empty or unusable, select it and click **Trash**. Trashed spools are hidden from the active list but not deleted — you can restore them.

Toggle the **Show Trashed** filter to view and restore trashed spools.

---

## 7. Printers

### Adding a Printer

Click **Add Printer** and fill in:

| Field | Notes |
|-------|-------|
| Name | e.g. "Ender 3 Pro #1" |
| Model | Official model name |
| Purchase price (EGP) | For depreciation calculation |
| Lifetime (kg) | Expected total grams before replacement |
| Nozzle cost (EGP) | Price of one brass nozzle |
| Nozzle lifetime (g) | Grams before replacing nozzle |
| Electricity rate (EGP/hr) | Your electricity cost per hour |

### Understanding Costs

| Metric | Formula |
|--------|---------|
| Depreciation per gram | Purchase price ÷ (Lifetime kg × 1000) |
| Nozzle cost per gram | Nozzle cost ÷ Nozzle lifetime (g) |
| Total print cost | (Depreciation + Nozzle + Electricity) × grams |

### Resetting Nozzle

When you physically replace a nozzle, select the printer and click **Reset Nozzle**. This resets the nozzle usage counter to 0 g.

### Active / Inactive

Toggle **Active** to mark a printer as in-service or offline. Inactive printers are not included in dashboard utilisation metrics.

---

## 8. Expenses

### Adding an Expense

Click **Add** and fill in:

| Field | Notes |
|-------|-------|
| Date | When you paid |
| Category | See categories below |
| Name | Short description, e.g. "eSUN PLA+ 5-pack" |
| Qty | Number of units |
| Unit Price (EGP) | Price per unit |
| Supplier | Optional — who you bought from |
| Notes | Optional |

**Categories:**

| Category | Use for |
|----------|---------|
| Filament | Filament purchases |
| Bills | Electricity, internet, rent |
| Maintenance | Printer repairs, parts |
| Consumables | Nozzles, build plates, glue |
| Tools | New tools or equipment |
| Packaging | Boxes, tape, wrap |
| Shipping | Delivery / courier costs |
| Engineer | Labour or freelancer fees |
| Software | Subscriptions, licenses |
| Other | Anything else |

### Filtering

Use the **Category** dropdown to filter the list. The summary cards at the top show the total and top-4 categories for the current view.

---

## 9. Print Failures

Logging failures helps you track waste costs and identify recurring problems.

### Logging a Failure

Click **Log Failure** and fill in:

| Field | Notes |
|-------|-------|
| Date | When it failed |
| Source | Customer Order / R&D Project / Personal/Test / Other |
| Reason | Select from the list |
| Order ID | Only if Source is Customer Order |
| Item Name | What was being printed |
| Filament Lost (g) | Grams of filament wasted |
| Time Lost (min) | Print time wasted |
| Notes | What happened and why |

**Failure reasons include:** Nozzle Clog, Bed Adhesion, Layer Shift, Filament Tangle, Power Outage, Stringing/Blobs, Warping, Under/Over Extrusion, Wrong Settings, Filament Ran Out, Machine Error.

### Reading the Summary Cards

| Card | Meaning |
|------|---------|
| Total Failures | Count for the current filter |
| Filament Lost | Grams wasted across all failures shown |
| Time Lost | Hours wasted across all failures shown |

The **Est. Cost** column in the table is calculated from the default cost-per-gram setting.

---

## 10. Settings

Access via the gear icon in the sidebar.

### Company Information

Changes here are reflected immediately on all generated PDFs and on the login screen. Fill in your business name, contact details, and branding text.

### Pricing Defaults

| Field | Effect |
|-------|--------|
| Rate per gram (EGP) | Default selling price used when creating new order items |
| Cost per gram (EGP) | Material cost — used in profit calculations |
| Currency symbol | Shown on all monetary values |
| Deposit % | Pre-fills the deposit field on new orders |
| Quote validity (days) | Expiry shown on quote PDFs |
| Next order number | Auto-increments; change only if you need to re-sequence |

Click **Save Settings** — changes take effect immediately.

---

## 11. Backing Up Your Data

All data lives in `data/abaad_v5.db`. Back it up regularly.

### Manual backup via command line

```bash
python -c "from src.core.database import get_database; get_database().backup_database()"
```

Backups are written to `data/backups/` with a timestamp in the filename.

### Manual copy

```bash
cp data/abaad_v5.db data/backups/abaad_v5_$(date +%Y%m%d).db
```

### Restoring

Stop the servers (`Ctrl+C`), replace `data/abaad_v5.db` with your backup copy, then restart with `make dev`.

---

## 12. Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |

**Change the password after first login.** Admin has full access to all features and settings. A standard User role has access to orders, customers, and inventory viewing only.

---

## Tips

- **Keyboard shortcut** — press `Ctrl+K` or click the search icon to quickly navigate between screens (if sidebar search is enabled).
- **Printer cost per gram** — the number shown on the Printers screen is the all-in cost for printing one gram (depreciation + nozzle + electricity). Use this to sanity-check your rate.
- **R&D orders** — toggling R&D on an order prices items at cost-per-gram only. Use this for test prints and internal projects so they don't inflate your profit margin.
- **Filament reservation** — when an order is Confirmed or In Progress, its filament weight is reserved and deducted from Available stock even though the spool is not yet consumed.
- **Overdue alerts** — the dashboard flags Ready orders that have been waiting more than 3 days. Follow up with the customer to arrange delivery.
