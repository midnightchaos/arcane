# ARCANE Build & Run Automation

.PHONY: install run test

install:
	@echo "Installing dependencies..."
	@if [ -f scripts/fresh_install.sh ]; then \
		bash scripts/fresh_install.sh; \
	else \
		cmd.exe /c scripts\\fresh_install.bat; \
	fi

run:
	@echo "Starting application..."
	@if [ -f scripts/run.sh ]; then \
		bash scripts/run.sh; \
	else \
		cmd.exe /c scripts\\run.bat; \
	fi

test:
	@echo "Running backend test suite..."
	@if [ -d backend/venv/Scripts ]; then \
		backend/venv/Scripts/pytest; \
	else \
		backend/venv/bin/pytest; \
	fi
