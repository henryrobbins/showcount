.PHONY: dev install lint format typecheck test docker

install:
	uv sync --all-extras

dev:
	uv run uvicorn app.main:app --reload --port 8000

lint:
	uv run ruff check app/ tests/

format:
	uv run ruff format app/ tests/

typecheck:
	uv run mypy app/

test:
	uv run pytest tests/ -v

docker:
	docker build -t showcount-agent .
