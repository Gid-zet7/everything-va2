@echo off
REM Use this script to start a podman container for a local development database

set DB_CONTAINER_NAME=normalhuman-postgres

echo Checking if Podman is available...
podman --version >nul 2>&1
if errorlevel 1 (
    echo Podman is not installed or not in PATH. Please install Podman Desktop and try again.
    pause
    exit /b 1
)

echo Checking if database container is already running...
podman ps -q -f name=%DB_CONTAINER_NAME% >nul 2>&1
if not errorlevel 1 (
    echo Database container '%DB_CONTAINER_NAME%' already running
    pause
    exit /b 0
)

echo Checking if database container exists...
podman ps -q -a -f name=%DB_CONTAINER_NAME% >nul 2>&1
if not errorlevel 1 (
    echo Starting existing database container '%DB_CONTAINER_NAME%'...
    podman start %DB_CONTAINER_NAME%
    echo Existing database container '%DB_CONTAINER_NAME%' started
    pause
    exit /b 0
)

echo Creating new database container...
podman run -d ^
  --name %DB_CONTAINER_NAME% ^
  -e POSTGRES_USER=postgres ^
  -e POSTGRES_PASSWORD=password ^
  -e POSTGRES_DB=normalhuman ^
  -p 5432:5432 ^
  docker.io/postgres

if errorlevel 1 (
    echo Failed to create database container. Please check if Podman is running.
    pause
    exit /b 1
)

echo Database container '%DB_CONTAINER_NAME%' was successfully created
echo.
echo Next steps:
echo 1. Run: npx prisma db push
echo 2. Run: npx prisma generate
echo.
pause
