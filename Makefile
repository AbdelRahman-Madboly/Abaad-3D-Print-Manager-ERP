.PHONY: install test lint build clean run run-bundle venv

# ── Setup ─────────────────────────────────────────────────────────────────────

venv:
	python3 -m venv .venv
	.venv/bin/pip install -e ".[dev]"

install:
	pip install -e ".[dev]"

# ── Development ───────────────────────────────────────────────────────────────

test:
	python3 -m pytest -q

lint:
	python3 -m ruff check src/ tests/ main.py

run:
	python3 main.py

# ── Packaging (Ubuntu) ────────────────────────────────────────────────────────

build:
	.venv/bin/pyinstaller abaad-erp.spec --clean

run-bundle:
	./dist/abaad-erp/abaad-erp

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean:
	rm -rf dist/ build/ *.spec.bak __pycache__ .pytest_cache
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
