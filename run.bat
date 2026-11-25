@echo off
title Google Maps Lead Generator
cd /d "%~dp0"
echo ========================================================
echo  Starting Google Maps Lead Generator (FastAPI + React)
echo  Opening http://127.0.0.1:8000 in your browser...
echo ========================================================
start http://127.0.0.1:8000
.\venv\Scripts\python.exe server.py
pause
