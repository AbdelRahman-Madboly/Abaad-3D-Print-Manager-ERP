# Phase 6 — Cross-Platform Polish & UI/UX Audit
> **Type:** polish + audit. Small targeted fixes, no new features.
> **Session start:** `cat docs/CLAUDE.md` then this file.
> **Prerequisite:** Phase 5 complete, launchers working.
> **Branch:** `fix/phase-6-polish` off `develop`

---

## Goal

Fix any cross-platform rendering issues that show up after real use on Ubuntu
and Windows. Audit the full UI for friction points and fix the ones that are
small, safe, and high-impact. Larger UX work gets noted for a future phase.

---

## Tasks

### Task 1 — Cross-platform rendering audit

Run the app on Ubuntu and go through every tab. Note any of these:

**Things to fix immediately:**
- Any tab that shows an error or traceback on load
- Buttons or labels with no visible text (font rendering issue)
- Input fields that are too narrow to use
- Dialogs that open off-screen or at wrong size
- Widgets that don't resize when the window is resized

**Things to note for later (do not fix in this phase):**
- Layout improvements that would require redesigning a whole tab
- New features
- Color scheme changes

Run the same check on Windows if available; if not, note it for a future
Windows-specific test session.

### Task 2 — Empty state handling

Every tab should handle "no data" gracefully. Go through each tab and
check what happens when the relevant table is empty:

| Tab | What to show when empty |
|-----|------------------------|
| Orders | "No orders yet. Click + New Order to get started." |
| Customers | "No customers yet." |
| Filament | "No filament in stock. Add spools in the setup wizard or here." |
| Printers | "No printers configured. Add your first printer here." |
| Expenses | "No expenses recorded." |
| Failures | "No failures recorded." |
| Dashboard | Action Center: "✅ No alerts" cards; Charts: "No data yet" |

For any tab that currently crashes or shows a blank/broken UI on empty DB:
fix it. For any that already shows a reasonable message: note it as working.

Implement a simple helper in `src/ui/widgets.py`:
```python
def empty_state_label(parent, message: str, bg: str) -> tk.Label:
    """Return a centered label for empty-data states."""
    return tk.Label(
        parent,
        text=message,
        bg=bg,
        fg=Colors.TEXT_SECONDARY,
        font=Fonts.BODY,
        wraplength=400,
        justify="center",
    )
```

### Task 3 — Tooltip for icon-only buttons

Find all buttons in the UI that have only an emoji/icon label and no visible
text description. Add a simple tooltip that shows on hover.

Add to `src/ui/widgets.py`:
```python
class Tooltip:
    """Simple hover tooltip for any widget."""
    def __init__(self, widget: tk.Widget, text: str) -> None:
        self._widget = widget
        self._text = text
        self._tip: tk.Toplevel | None = None
        widget.bind("<Enter>", self._show)
        widget.bind("<Leave>", self._hide)

    def _show(self, _event=None) -> None:
        x = self._widget.winfo_rootx() + 20
        y = self._widget.winfo_rooty() + self._widget.winfo_height() + 4
        self._tip = tk.Toplevel(self._widget)
        self._tip.wm_overrideredirect(True)
        self._tip.wm_geometry(f"+{x}+{y}")
        tk.Label(
            self._tip, text=self._text,
            bg="#ffffe0", fg="#333333",
            font=("TkDefaultFont", 9),
            relief="solid", borderwidth=1, padx=4, pady=2,
        ).pack()

    def _hide(self, _event=None) -> None:
        if self._tip:
            self._tip.destroy()
            self._tip = None
```

Usage: `Tooltip(btn, "Add new order")`

Apply to icon-only buttons in at least: the main toolbar, the Orders tab
action buttons, and the Dashboard Action Center cards.

### Task 4 — Consistent window sizing

Check that the main window opens at a reasonable default size that fits
all tabs on common screen resolutions (1366×768 minimum).

In `app.py` `_setup_window()`:
```python
# Set minimum size and sensible default
self._root.minsize(1100, 700)
self._root.geometry("1280x800")  # default — user can resize
```

Adjust values based on what actually fits. The window should be resizable
and all tab content should adapt.

### Task 5 — Scrollable tabs

Any tab whose content overflows at 1100×700 should use `ScrollableFrame`
(if it exists in `widgets.py`) or add one. Check:
- Settings tab (long form — likely needs scroll)
- Dashboard tab (5 sections — likely needs scroll)
- Any others that overflow

If `ScrollableFrame` doesn't exist in `widgets.py`, add it:
```python
class ScrollableFrame(tk.Frame):
    """A frame with a vertical scrollbar."""
    def __init__(self, parent, bg: str = Colors.BG, **kwargs):
        super().__init__(parent, bg=bg, **kwargs)
        canvas = tk.Canvas(self, bg=bg, highlightthickness=0)
        scrollbar = ttk.Scrollbar(self, orient="vertical", command=canvas.yview)
        self.inner = tk.Frame(canvas, bg=bg)
        self.inner.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        canvas.create_window((0, 0), window=self.inner, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        # Mouse wheel support
        canvas.bind_all("<MouseWheel>", lambda e: canvas.yview_scroll(-1 * (e.delta // 120), "units"))
        canvas.bind_all("<Button-4>", lambda e: canvas.yview_scroll(-1, "units"))
        canvas.bind_all("<Button-5>", lambda e: canvas.yview_scroll(1, "units"))
```

### Task 6 — Status bar improvements

The status bar currently shows filament weight and app version. Add:
- Current user's name and role (e.g. `"admin (Admin)"`)
- A small "●" indicator that flashes briefly on any save action
  (this is the `on_status_change` callback that already exists — just verify it's wired)

---

## Acceptance criteria

- [ ] Every tab loads without error on a fresh DB (empty state handled).
- [ ] Every tab loads without error on a seeded DB.
- [ ] `empty_state_label` helper exists in `widgets.py`.
- [ ] `Tooltip` class exists in `widgets.py` and is applied to icon-only buttons.
- [ ] `ScrollableFrame` exists in `widgets.py`.
- [ ] Main window opens at 1280×800, minimum size 1100×700.
- [ ] Settings tab and Dashboard tab scroll when content overflows.
- [ ] Status bar shows current user name and role.
- [ ] `pytest -q` → zero failures (report count).
- [ ] No Tk font errors in console on Ubuntu.

---

## Git commits

```
fix(ui): handle empty-data states in all tabs; add empty_state_label helper
feat(widgets): add Tooltip class; apply to icon-only buttons
feat(widgets): add/verify ScrollableFrame; apply to settings and dashboard tabs
fix(app): set minimum window size and sensible default geometry
fix(app): show current user name and role in status bar
```

---

## Completion Report

```markdown
# Phase 6 Completion Report — Cross-Platform Polish & UI/UX Audit

## Summary

## Empty state audit results
(table: tab, was empty state broken?, what was done)

## Cross-platform rendering issues found and fixed

## Deferred UX issues (noted for future phase)

## Files Changed

## Git Commits

## Tests
pytest result: N passed / N skipped / N failed

## Acceptance Criteria Status
- [x] / [ ] each

## Open Questions / Notes for Master Chat
```
