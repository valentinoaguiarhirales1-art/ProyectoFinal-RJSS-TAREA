@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Necesitas instalar Node.js desde https://nodejs.org
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
)
echo Iniciando SudoKlar en http://localhost:5173 ...
call npm run dev -- --open --host 127.0.0.1 --port 5173 --strictPort
pause
