"""
src/ui/tabs/dashboard_tab.py
=============================
Unified Dashboard tab for Print3D Manager (Phase 4).

Replaces the old Stats and Analytics tabs with a single admin view,
organized into five sections (top to bottom):

  1. Action Center        — alert cards (low filament / orders needing
                             attention / printer maintenance). Clicking a
                             card switches to the relevant tab via
                             ``on_navigate(tab_key)``.
  2. Headline Numbers      — StatCards (Total Revenue, Net Profit, Active
                             Orders, Available Filament), driven by a shared
                             period selector.
  3. Charts                — the 5 Analytics charts (relocated from the
                             previous Analytics tab), sharing the same
                             period selector as Section 2. Degrades
                             gracefully if matplotlib isn't installed.
  4. Printer Utilization   — per-printer printed kg / lifetime kg, nozzle
                             wear %, and total running cost.
  5. Detailed Breakdowns    — Costs / Failures / Expenses / Customers stat
                             cards (relocated from the previous Stats tab).

Admin-only — same access level as the old Stats/Analytics tabs (see
``src.auth.auth_manager.User.can_access_tab``, ``"dashboard"`` entry).

Per the project's architecture rules, this tab contains NO business logic:
all alert/aggregation logic lives in the services it's constructed with.
"""

import tkinter as tk
from datetime import datetime, timedelta
from tkinter import ttk

from src.services.customer_service import CustomerService
from src.services.finance_service import FinanceService
from src.services.inventory_service import InventoryService
from src.services.order_service import OrderService
from src.services.printer_service import PrinterService
from src.ui.theme import Colors, Fonts
from src.ui.widgets import AlertCard, ScrollableFrame, StatCard, Tooltip
from src.utils.helpers import format_currency, format_time_minutes

# Matplotlib is optional — graceful degradation (same pattern as the
# previous Analytics tab)
try:
    import matplotlib
    matplotlib.use("TkAgg")
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
    from matplotlib.figure import Figure
    MATPLOTLIB_AVAILABLE = True
except ImportError:
    MATPLOTLIB_AVAILABLE = False


_CHART_COLORS = [
    "#1e3a8a", "#3b82f6", "#10b981", "#f59e0b",
    "#ef4444", "#7c3aed", "#06b6d4", "#f97316",
    "#ec4899", "#84cc16",
]

_PERIODS = [
    ("Last 30 days", "last_30"),
    ("Last 90 days", "last_90"),
    ("This year",    "this_year"),
    ("All time",     "all"),
]


def _slugify(label: str) -> str:
    """Turn a card label into a dict-key-safe slug (matches the previous
    Stats tab's card-key convention)."""
    return (
        label.lower()
        .replace(" ", "_")
        .replace("%", "pct")
        .replace("(", "")
        .replace(")", "")
        .replace("/", "_")
    )


class DashboardTab(ttk.Frame):
    """Unified Dashboard tab — see module docstring for the 5 sections.

    Args:
        parent:            ttk.Notebook parent.
        finance_service:   FinanceService instance.
        customer_service:  CustomerService instance.
        inventory_service: InventoryService instance.
        printer_service:   PrinterService instance.
        order_service:     OrderService instance.
        user:              Currently logged-in User object.
        on_navigate:       Optional ``callable(tab_key: str)`` invoked when
                           an Action Center alert card is clicked, to switch
                           the main notebook to another tab (e.g.
                           ``"orders"``, ``"filament"``, ``"printers"``).
        on_status_change:  Optional callback (matches the pattern used by
                           other tabs); unused here but accepted for a
                           consistent constructor signature.
    """

    def __init__(self, parent, finance_service: FinanceService,
                 customer_service: CustomerService,
                 inventory_service: InventoryService,
                 printer_service: PrinterService,
                 order_service: OrderService,
                 user, on_navigate=None, on_status_change=None) -> None:
        super().__init__(parent, padding=10)
        self._fin      = finance_service
        self._cust     = customer_service
        self._inv      = inventory_service
        self._printer  = printer_service
        self._order    = order_service
        self._user     = user
        self._on_navigate = on_navigate or (lambda tab_key: None)

        self._stat_cards: dict = {}
        self._detail_cards: dict = {}
        self._chart_frames: dict = {}

        self._build_ui()
        self.refresh()

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------

    def refresh(self) -> None:
        """Reload every section from the services."""
        self._refresh_action_center()
        self._refresh_headline()
        if MATPLOTLIB_AVAILABLE:
            self._draw_charts()
        self._refresh_printer_utilization()
        self._refresh_breakdowns()

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------

    def _build_ui(self) -> None:
        self.rowconfigure(0, weight=1)
        self.columnconfigure(0, weight=1)

        scroll = ScrollableFrame(self)
        scroll.grid(row=0, column=0, sticky="nsew")
        body = scroll.inner
        body.columnconfigure(0, weight=1)

        ttk.Label(body, text="📊 Dashboard",
                  style="Title.TLabel").grid(row=0, column=0, sticky="w",
                                              pady=(0, 8))

        # ---- Section 1: Action Center ----
        ttk.Label(body, text="Action Center",
                  style="Header.TLabel").grid(row=1, column=0, sticky="w",
                                               pady=(4, 4))
        self._action_frame = ttk.Frame(body)
        self._action_frame.grid(row=2, column=0, sticky="ew", pady=(0, 14))

        # ---- Section 2: Headline Numbers (+ shared period selector) ----
        toolbar = ttk.Frame(body)
        toolbar.grid(row=3, column=0, sticky="ew", pady=(4, 4))
        ttk.Label(toolbar, text="Overview",
                  style="Header.TLabel").pack(side=tk.LEFT)
        self._build_period_selector(toolbar)

        self._headline_frame = ttk.Frame(body)
        self._headline_frame.grid(row=4, column=0, sticky="ew", pady=(0, 14))
        self._build_headline_cards()

        # ---- Section 3: Charts ----
        ttk.Label(body, text="Charts",
                  style="Header.TLabel").grid(row=5, column=0, sticky="w",
                                               pady=(4, 4))
        self._charts_container = ttk.Frame(body)
        self._charts_container.grid(row=6, column=0, sticky="nsew", pady=(0, 14))
        self._build_charts_section()

        # ---- Section 4: Printer Utilization ----
        ttk.Label(body, text="🖨 Printer Utilization",
                  style="Header.TLabel").grid(row=7, column=0, sticky="w",
                                               pady=(4, 4))
        self._printer_frame = ttk.Frame(body)
        self._printer_frame.grid(row=8, column=0, sticky="ew", pady=(0, 14))

        # ---- Section 5: Detailed Breakdowns ----
        ttk.Label(body, text="Detailed Breakdowns",
                  style="Header.TLabel").grid(row=9, column=0, sticky="w",
                                               pady=(4, 4))
        self._breakdown_frame = ttk.Frame(body)
        self._breakdown_frame.grid(row=10, column=0, sticky="ew")
        self._build_breakdown_sections()

    # ------------------------------------------------------------------
    # Section 1 — Action Center
    # ------------------------------------------------------------------

    def _refresh_action_center(self) -> None:
        for w in self._action_frame.winfo_children():
            w.destroy()

        # -- Low filament --
        low_spools  = self._inv.get_low_spools()
        low_colors  = sorted({s.color for s in low_spools})
        low_subtitle = ", ".join(low_colors)

        # -- Orders needing attention --
        attention      = self._order.get_orders_needing_attention()
        ready_overdue  = attention.get("ready_overdue", [])
        payment_due    = attention.get("payment_due", [])
        order_ids      = {o.id for o in ready_overdue} | {o.id for o in payment_due}
        breakdown_bits = []
        if ready_overdue:
            breakdown_bits.append(f"{len(ready_overdue)} ready & overdue")
        if payment_due:
            breakdown_bits.append(f"{len(payment_due)} payment due")
        orders_subtitle = " · ".join(breakdown_bits)

        # -- Printer maintenance --
        needs_maintenance = self._printer.get_printers_needing_maintenance()
        maint_subtitle    = ", ".join(p.name for p in needs_maintenance)

        cards = [
            AlertCard(
                self._action_frame, "Low Filament", len(low_spools),
                subtitle=low_subtitle, ok_text="Filament levels OK",
                on_click=lambda: self._on_navigate("filament"),
            ),
            AlertCard(
                self._action_frame, "Orders Needing Attention", len(order_ids),
                subtitle=orders_subtitle, ok_text="No orders need attention",
                on_click=lambda: self._on_navigate("orders"),
            ),
            AlertCard(
                self._action_frame, "Printer Maintenance", len(needs_maintenance),
                subtitle=maint_subtitle, ok_text="No printers need attention",
                on_click=lambda: self._on_navigate("printers"),
            ),
        ]
        for i, card in enumerate(cards):
            card.grid(row=0, column=i, padx=6, pady=4, sticky="ew")
            self._action_frame.columnconfigure(i, weight=1)

    # ------------------------------------------------------------------
    # Section 2 — Headline Numbers
    # ------------------------------------------------------------------

    def _build_period_selector(self, parent: ttk.Frame) -> None:
        ttk.Label(parent, text="Period:").pack(side=tk.LEFT, padx=(20, 4))
        self._period_var = tk.StringVar(value="last_90")
        for label, value in _PERIODS:
            ttk.Radiobutton(
                parent, text=label, variable=self._period_var, value=value,
                command=self._on_period_change,
            ).pack(side=tk.LEFT, padx=4)
        _refresh_btn = ttk.Button(parent, text="🔄 Refresh",
                                   command=self.refresh)
        _refresh_btn.pack(side=tk.RIGHT)
        Tooltip(_refresh_btn, "Reload all dashboard data")

    def _on_period_change(self) -> None:
        self._refresh_headline()
        if MATPLOTLIB_AVAILABLE:
            self._draw_charts()

    def _get_date_range(self) -> tuple[str, str]:
        """Return (start_date, end_date) based on the selected period."""
        period = self._period_var.get()
        now = datetime.now()
        if period == "last_30":
            start = now - timedelta(days=30)
        elif period == "last_90":
            start = now - timedelta(days=90)
        elif period == "this_year":
            start = datetime(now.year, 1, 1)
        else:
            start = datetime(2020, 1, 1)
        return start.strftime("%Y-%m-%d"), now.strftime("%Y-%m-%d")

    def _build_headline_cards(self) -> None:
        cards = [
            ("revenue",       "Total Revenue",      Colors.SUCCESS),
            ("net_profit",    "Net Profit",         Colors.PRIMARY),
            ("active_orders", "Active Orders",      Colors.PURPLE),
            ("filament",      "Available Filament", Colors.INFO),
        ]
        for i, (key, label, color) in enumerate(cards):
            card = StatCard(self._headline_frame, label, "—", color=color)
            card.grid(row=0, column=i, padx=6, pady=4, sticky="ew")
            self._headline_frame.columnconfigure(i, weight=1)
            self._stat_cards[key] = card

    def _refresh_headline(self) -> None:
        start, end = self._get_date_range()
        report = self._fin.get_profit_report(start, end)

        orders = self._order.get_all_orders(include_deleted=False)
        active = sum(1 for o in orders if o.status not in ("Delivered", "Cancelled"))

        inv = self._inv.get_inventory_summary()

        self._stat_cards["revenue"].set_value(
            format_currency(report.get("revenue", 0)))
        self._stat_cards["net_profit"].set_value(
            format_currency(report.get("net_profit", 0)))
        self._stat_cards["active_orders"].set_value(str(active))
        self._stat_cards["filament"].set_value(
            f"{inv.get('available_weight_g', 0):,.0f} g")

    # ------------------------------------------------------------------
    # Section 3 — Charts  (relocated from the previous Analytics tab)
    # ------------------------------------------------------------------

    def _build_charts_section(self) -> None:
        if not MATPLOTLIB_AVAILABLE:
            ttk.Label(
                self._charts_container,
                text="matplotlib is not installed.\n\n"
                     "Install it to enable charts:\n"
                     "    pip install matplotlib",
                style="Subtitle.TLabel",
                justify="center",
            ).pack(pady=20)
            return

        self._charts_container.rowconfigure(0, weight=1)
        self._charts_container.columnconfigure(0, weight=1)

        nb = ttk.Notebook(self._charts_container)
        nb.grid(row=0, column=0, sticky="nsew")
        self._charts_nb = nb

        chart_tabs = [
            ("revenue",  "💰 Monthly Revenue"),
            ("status",   "📦 Order Status"),
            ("profit",   "📈 Profit Trend"),
            ("expenses", "🧾 Expenses"),
            ("filament", "🧵 Filament"),
        ]
        for key, label in chart_tabs:
            frame = ttk.Frame(nb)
            nb.add(frame, text=label)
            self._chart_frames[key] = frame

    def _clear_frame(self, key: str) -> None:
        for w in self._chart_frames[key].winfo_children():
            w.destroy()

    def _embed_figure(self, fig: "Figure", key: str) -> None:
        self._clear_frame(key)
        canvas = FigureCanvasTkAgg(fig, master=self._chart_frames[key])
        canvas.draw()
        canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)

    def _draw_charts(self) -> None:
        start, end = self._get_date_range()
        self._draw_revenue_chart(start, end)
        self._draw_status_pie(start, end)
        self._draw_profit_trend(start, end)
        self._draw_expenses_pie(start, end)
        self._draw_filament_chart(start, end)

    # -- Revenue bar chart --

    def _draw_revenue_chart(self, start: str, end: str) -> None:
        monthly = self._fin.get_monthly_revenue(start, end)
        fig = Figure(figsize=(10, 4), dpi=95, facecolor=Colors.BG)
        ax  = fig.add_subplot(111, facecolor=Colors.BG)

        if not monthly:
            ax.text(0.5, 0.5, "No data", ha="center", va="center",
                    transform=ax.transAxes, color=Colors.TEXT_SECONDARY)
        else:
            months  = [m["month"] for m in monthly]
            revenue = [m["revenue"] for m in monthly]
            costs   = [m["costs"]   for m in monthly]
            profit  = [m["profit"]  for m in monthly]

            x = range(len(months))
            width = 0.25
            ax.bar([i - width for i in x], revenue, width, label="Revenue",
                   color=Colors.SUCCESS, alpha=0.85)
            ax.bar(list(x), costs, width, label="Costs",
                   color=Colors.DANGER, alpha=0.85)
            ax.bar([i + width for i in x], profit, width, label="Profit",
                   color=Colors.PRIMARY, alpha=0.85)

            ax.set_xticks(list(x))
            ax.set_xticklabels(months, rotation=45, ha="right",
                                color=Colors.TEXT_SECONDARY, fontsize=8)
            ax.legend(facecolor=Colors.CARD, labelcolor=Colors.TEXT)
            ax.tick_params(colors=Colors.TEXT_SECONDARY)
            for spine in ax.spines.values():
                spine.set_edgecolor(Colors.BORDER)

        ax.set_title("Monthly Revenue vs Costs vs Profit",
                     color=Colors.TEXT, fontsize=12)
        fig.tight_layout()
        self._embed_figure(fig, "revenue")

    # -- Order status pie --

    def _draw_status_pie(self, start: str, end: str) -> None:
        data = self._fin.get_order_status_breakdown(start, end)
        fig  = Figure(figsize=(6, 4), dpi=95, facecolor=Colors.BG)
        ax   = fig.add_subplot(111, facecolor=Colors.BG)

        if not data:
            ax.text(0.5, 0.5, "No data", ha="center", va="center",
                    transform=ax.transAxes, color=Colors.TEXT_SECONDARY)
        else:
            labels = [d["status"] for d in data]
            sizes  = [d["count"]  for d in data]
            ax.pie(sizes, labels=labels, autopct="%1.0f%%",
                   colors=_CHART_COLORS[:len(labels)],
                   textprops={"color": Colors.TEXT})
        ax.set_title("Order Status Breakdown", color=Colors.TEXT, fontsize=12)
        fig.tight_layout()
        self._embed_figure(fig, "status")

    # -- Profit trend line --

    def _draw_profit_trend(self, start: str, end: str) -> None:
        monthly = self._fin.get_monthly_revenue(start, end)
        fig = Figure(figsize=(10, 4), dpi=95, facecolor=Colors.BG)
        ax  = fig.add_subplot(111, facecolor=Colors.BG)

        if not monthly:
            ax.text(0.5, 0.5, "No data", ha="center", va="center",
                    transform=ax.transAxes, color=Colors.TEXT_SECONDARY)
        else:
            months = [m["month"]  for m in monthly]
            profit = [m["profit"] for m in monthly]

            ax.plot(months, profit, marker="o", color=Colors.PRIMARY,
                    linewidth=2, markersize=5)
            ax.fill_between(months, profit, alpha=0.15, color=Colors.PRIMARY)
            ax.axhline(0, color=Colors.DANGER, linewidth=0.8, linestyle="--")
            ax.set_xticks(range(len(months)))
            ax.set_xticklabels(months, rotation=45, ha="right",
                                color=Colors.TEXT_SECONDARY, fontsize=8)
            ax.tick_params(colors=Colors.TEXT_SECONDARY)
            for spine in ax.spines.values():
                spine.set_edgecolor(Colors.BORDER)

        ax.set_title("Profit Trend", color=Colors.TEXT, fontsize=12)
        fig.tight_layout()
        self._embed_figure(fig, "profit")

    # -- Expenses pie --

    def _draw_expenses_pie(self, start: str, end: str) -> None:
        data = self._fin.get_expenses_by_category(start, end)
        fig  = Figure(figsize=(6, 4), dpi=95, facecolor=Colors.BG)
        ax   = fig.add_subplot(111, facecolor=Colors.BG)

        if not data:
            ax.text(0.5, 0.5, "No expenses", ha="center", va="center",
                    transform=ax.transAxes, color=Colors.TEXT_SECONDARY)
        else:
            labels = [d["category"] for d in data]
            sizes  = [d["total"]    for d in data]
            ax.pie(sizes, labels=labels, autopct="%1.0f%%",
                   colors=_CHART_COLORS[:len(labels)],
                   textprops={"color": Colors.TEXT})
        ax.set_title("Expenses by Category", color=Colors.TEXT, fontsize=12)
        fig.tight_layout()
        self._embed_figure(fig, "expenses")

    # -- Filament bar --

    def _draw_filament_chart(self, start: str, end: str) -> None:
        data = self._fin.get_filament_usage_by_color(start, end)
        fig  = Figure(figsize=(10, 4), dpi=95, facecolor=Colors.BG)
        ax   = fig.add_subplot(111, facecolor=Colors.BG)

        if not data:
            ax.text(0.5, 0.5, "No data", ha="center", va="center",
                    transform=ax.transAxes, color=Colors.TEXT_SECONDARY)
        else:
            colors_list = [d["color"] for d in data]
            grams       = [d["grams"] for d in data]
            ax.barh(colors_list, grams, color=_CHART_COLORS[:len(colors_list)],
                    alpha=0.85)
            ax.tick_params(colors=Colors.TEXT_SECONDARY)
            for spine in ax.spines.values():
                spine.set_edgecolor(Colors.BORDER)

        ax.set_title("Filament Usage by Color (g)", color=Colors.TEXT,
                     fontsize=12)
        fig.tight_layout()
        self._embed_figure(fig, "filament")

    # ------------------------------------------------------------------
    # Section 4 — Printer Utilization
    # ------------------------------------------------------------------

    def _refresh_printer_utilization(self) -> None:
        for w in self._printer_frame.winfo_children():
            w.destroy()

        printers = self._printer.get_all_printers()
        if not printers:
            ttk.Label(self._printer_frame, text="No printers configured.",
                      style="Subtitle.TLabel").grid(row=0, column=0,
                                                     sticky="w", pady=10)
            return

        self._printer_frame.columnconfigure(0, weight=1)
        for row_i, printer in enumerate(printers):
            stats = self._printer.get_printer_stats(printer.id)
            if not stats:
                continue

            card = ttk.Frame(self._printer_frame, style="Card.TFrame",
                              padding=10)
            card.grid(row=row_i, column=0, sticky="ew", pady=4)
            card.columnconfigure(1, weight=1)
            card.columnconfigure(3, weight=1)

            ttk.Label(card, text=printer.name, style="Section.TLabel",
                      width=18).grid(row=0, column=0, rowspan=2,
                                      sticky="w", padx=(0, 12))

            printed_kg   = stats["total_printed_grams"] / 1000.0
            lifetime_kg  = printer.lifetime_kg
            lifetime_pct = min(100.0, stats["lifetime_used_pct"])
            nozzle_pct   = min(100.0, stats["nozzle_usage_pct"])

            ttk.Label(card, style="Card.TLabel",
                      text=f"Printed: {printed_kg:.2f} / {lifetime_kg:.0f} kg "
                           f"({lifetime_pct:.0f}%)"
                      ).grid(row=0, column=1, sticky="w", padx=4, pady=2)
            ttk.Progressbar(card, maximum=100, value=lifetime_pct
                            ).grid(row=0, column=2, sticky="ew", padx=8)

            ttk.Label(card, style="Card.TLabel",
                      text=f"Nozzle wear: {nozzle_pct:.0f}%"
                      ).grid(row=1, column=1, sticky="w", padx=4, pady=2)
            ttk.Progressbar(card, maximum=100, value=nozzle_pct
                            ).grid(row=1, column=2, sticky="ew", padx=8)

            ttk.Label(
                card, style="Card.TLabel",
                text=f"Running cost: {format_currency(stats['total_running_cost'])}",
            ).grid(row=0, column=3, rowspan=2, sticky="e", padx=(12, 0))

    # ------------------------------------------------------------------
    # Section 5 — Detailed Breakdowns  (relocated from the previous Stats tab)
    # ------------------------------------------------------------------

    def _build_breakdown_sections(self) -> None:
        self._breakdown_frame.columnconfigure(0, weight=1)
        self._build_breakdown_section(
            "📉 Costs", "costs", Colors.DANGER,
            ["Material Cost", "Electricity", "Depreciation",
             "Nozzle Cost", "Failures Cost", "Total Expenses"])
        self._build_breakdown_section(
            "❌ Failures", "failures", Colors.WARNING,
            ["Failure Count", "Filament Wasted", "Time Wasted", "Failure Cost"])
        self._build_breakdown_section(
            "🧾 Expenses", "expenses", Colors.CYAN,
            ["Tools", "Consumables", "Maintenance", "Other", "Total"])
        self._build_breakdown_section(
            "👤 Customers", "customers", Colors.PURPLE,
            ["Total Customers", "Avg Spent / Customer"])

    def _build_breakdown_section(self, title: str, key: str, color: str,
                                  labels: list) -> None:
        row = len(self._breakdown_frame.grid_slaves())
        section = ttk.LabelFrame(self._breakdown_frame, text=title, padding=10)
        section.grid(row=row, column=0, sticky="ew", pady=(0, 10))

        cards_frame = ttk.Frame(section)
        cards_frame.pack(fill=tk.X)
        per_row = 4
        for i, label in enumerate(labels):
            r, c = divmod(i, per_row)
            card = tk.Frame(cards_frame, bg=color, padx=14, pady=10)
            card.grid(row=r, column=c, padx=4, pady=4, sticky="ew")
            cards_frame.columnconfigure(c, weight=1)
            tk.Label(card, text=label, bg=color, fg="white",
                     font=Fonts.SMALL).pack()
            val_lbl = tk.Label(card, text="—", bg=color, fg="white",
                               font=Fonts.BIG_NUMBER)
            val_lbl.pack()
            self._detail_cards[f"{key}_{_slugify(label)}"] = val_lbl

    def _refresh_breakdowns(self) -> None:
        stats  = self._fin.get_full_statistics()
        f_stat = self._fin.get_failure_stats()
        e_stat = self._fin.get_expense_stats()
        c_count = len(self._cust.get_all_customers())
        c_spent = stats.get("total_revenue", 0)

        def _set(key: str, value) -> None:
            lbl = self._detail_cards.get(key)
            if lbl:
                lbl.config(text=str(value))

        # Costs
        _set("costs_material_cost",  format_currency(stats.get("total_material", 0)))
        _set("costs_electricity",    format_currency(stats.get("total_electricity", 0)))
        _set("costs_depreciation",   format_currency(stats.get("total_depreciation", 0)))
        _set("costs_nozzle_cost",    format_currency(stats.get("total_nozzle", 0)))
        _set("costs_failures_cost",  format_currency(f_stat.get("total_cost", 0)))
        _set("costs_total_expenses", format_currency(e_stat.get("total_expenses", 0)))

        # Failures
        _set("failures_failure_count",   str(f_stat.get("total_failures", 0)))
        _set("failures_filament_wasted",
             f"{f_stat.get('total_filament_wasted', 0):.1f} g")
        _set("failures_time_wasted",
             format_time_minutes(int(f_stat.get("total_time_wasted", 0))))
        _set("failures_failure_cost", format_currency(f_stat.get("total_cost", 0)))

        # Expenses — by category (same totals visualised in the Expenses pie)
        by_cat         = e_stat.get("by_category", {})
        total_expenses = e_stat.get("total_expenses", 0)
        tools          = by_cat.get("Tools", 0.0)
        consumables    = by_cat.get("Consumables", 0.0)
        maintenance    = by_cat.get("Maintenance", 0.0)
        other          = total_expenses - tools - consumables - maintenance

        _set("expenses_tools",       format_currency(tools))
        _set("expenses_consumables", format_currency(consumables))
        _set("expenses_maintenance", format_currency(maintenance))
        _set("expenses_other",       format_currency(other))
        _set("expenses_total",       format_currency(total_expenses))

        # Customers
        _set("customers_total_customers", str(c_count))
        avg_c = (c_spent / c_count) if c_count else 0
        _set("customers_avg_spent___customer", format_currency(avg_c))
