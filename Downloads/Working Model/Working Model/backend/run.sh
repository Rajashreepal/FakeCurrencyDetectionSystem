#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
python3.12 -m venv .venv || python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
