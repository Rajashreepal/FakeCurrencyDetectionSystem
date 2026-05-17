#!/usr/bin/env bash
set -e
echo "Installing frontend dependencies..."
npm install
echo "Starting NoteShield AI frontend on http://localhost:5173"
npm run dev
