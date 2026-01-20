#!/bin/bash

# Configuration
# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ReleaseRite Startup Script ===${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 1. Prerequisites Check
echo -e "${BLUE}[1/5] Checking prerequisites...${NC}"
if ! command_exists docker; then
    echo -e "${RED}Error: docker is not installed.${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}Error: docker-compose is not installed.${NC}"
    exit 1
fi

# 2. Start Infrastructure
echo -e "${BLUE}[2/5] Starting Docker services (Postgres, pgAdmin)...${NC}"
docker-compose up -d

# Wait for Postgres to be ready
echo -e "${BLUE}Waiting for Database to be ready...${NC}"
until docker exec release-manager-postgres-1 pg_isready -U release_manager > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo -e "\n${GREEN}Database is ready!${NC}"

# 3. Initialize Database
echo -e "${BLUE}[3/5] Initializing Database...${NC}"
# Run init_db.py
if [ -f "scripts/init_db.py" ]; then
    echo "Running init_db.py..."
    ./venv/bin/python3 scripts/init_db.py
else
    echo -e "${RED}Warning: scripts/init_db.py not found.${NC}"
fi

# Run migrations
if [ -f "scripts/migrate_release_columns.py" ]; then
    echo "Running migration scripts..."
    ./venv/bin/python3 scripts/migrate_release_columns.py
fi

# 4. Start Application Components
echo -e "${BLUE}[4/5] Starting Application components...${NC}"

# Trap SIGINT to kill child processes when script exits
trap 'kill 0' SIGINT

# Start Backend
echo "Starting Backend (FastAPI)..."
./venv/bin/uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend (Next.js)..."
cd ui
npm run dev -- -p 3000 &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}=== Application Started Successfully ===${NC}"
echo -e "Backend:  http://localhost:8000"
echo -e "Frontend: http://localhost:3000"
echo -e "Docs:     http://localhost:8000/docs"
echo -e "${BLUE}Press Ctrl+C to stop all services.${NC}"

# Wait for processes
wait
