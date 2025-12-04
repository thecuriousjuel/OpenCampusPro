#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Student Management System Setup...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Python
if command_exists python3; then
    PYTHON_CMD=python3
elif command_exists python; then
    PYTHON_CMD=python
else
    echo -e "${RED}Error: Python is not installed.${NC}"
    exit 1
fi

# Check for Node.js
if ! command_exists node; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    exit 1
fi

# Check for npm
if ! command_exists npm; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}Prerequisites check passed.${NC}"

# Backend Setup
echo -e "${BLUE}Setting up Backend...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

source venv/bin/activate

echo "Installing backend dependencies..."
pip install -r requirements.txt

# Start Backend in background
echo "Starting Backend Server..."
python app.py > /dev/null 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"

cd ..

# Frontend Setup
echo -e "${BLUE}Setting up Frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start Frontend
echo "Starting Frontend Server..."
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started (PID: $FRONTEND_PID)${NC}"

# Open Browser
echo -e "${BLUE}Opening Application...${NC}"
sleep 5 # Wait for servers to start
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:5173"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:5173"
fi

echo -e "${GREEN}Application is running!${NC}"
echo "Press Ctrl+C to stop the servers."

# Handle cleanup
cleanup() {
    echo -e "\n${BLUE}Stopping servers...${NC}"
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit
}

trap cleanup SIGINT

wait
