#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting OpenCampusPro Setup...${NC}"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to open a new terminal window
open_terminal() {
    local title=$1
    local cmd=$2
    local dir=$(pwd)
    
    local exec_cmd="cd \"$dir\" && $cmd; echo; echo 'Press Enter to close...'; read"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "tell app \"Terminal\" to do script \"$exec_cmd\"" > /dev/null
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command_exists ptyxis; then
            ptyxis --new-window -- bash -c "$exec_cmd" &
        elif command_exists gnome-terminal; then
            gnome-terminal --title="$title" -- bash -c "$exec_cmd"
        elif command_exists konsole; then
            konsole --noclose -e bash -c "$exec_cmd" &
        elif command_exists xfce4-terminal; then
            xfce4-terminal --title="$title" --hold -e "bash -c '$exec_cmd'" &
        elif command_exists mate-terminal; then
            mate-terminal --title="$title" -e "bash -c '$exec_cmd'" &
        elif command_exists lxterminal; then
            lxterminal --title="$title" -e "bash -c '$exec_cmd'" &
        elif command_exists tilix; then
            tilix -e "bash -c '$exec_cmd'" &
        elif command_exists terminator; then
            terminator --title="$title" -e "bash -c '$exec_cmd'" &
        elif command_exists alacritty; then
            alacritty --title "$title" -e bash -c "$exec_cmd" &
        elif command_exists kitty; then
            kitty --title "$title" bash -c "$exec_cmd" &
        elif command_exists wezterm; then
            wezterm start -- bash -c "$exec_cmd" &
        elif command_exists foot; then
            foot --title="$title" bash -c "$exec_cmd" &
        elif command_exists sakura; then
            sakura --title "$title" -e "bash -c '$exec_cmd'" &
        elif command_exists st; then
            st -t "$title" -e bash -c "$exec_cmd" &
        elif command_exists x-terminal-emulator; then
            x-terminal-emulator -e "bash -c '$exec_cmd'" &
        elif command_exists xterm; then
            xterm -title "$title" -e "bash -c '$exec_cmd'" &
        elif command_exists tmux; then
            echo -e "${BLUE}No GUI terminal found. Using tmux session '$title'.${NC}"
            tmux new-session -d -s "$title" "bash -c '$exec_cmd'"
        elif command_exists screen; then
            echo -e "${BLUE}No GUI terminal found. Using screen session '$title'.${NC}"
            screen -dmS "$title" bash -c "$exec_cmd"
        else
            echo -e "${RED}No supported terminal emulator or multiplexer found. Running in background.${NC}"
            eval "$cmd > /dev/null 2>&1 &"
        fi
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        start "$title" bash -c "$exec_cmd"
    else
        echo -e "${RED}Unsupported OS for opening new terminals. Running in background.${NC}"
        eval "$cmd > /dev/null 2>&1 &"
    fi
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

# Start Backend in new window
echo "Starting Backend Server in a new window..."
open_terminal "Backend" "source venv/bin/activate && $PYTHON_CMD app.py"
echo -e "${GREEN}Backend started.${NC}"

cd ..

# Frontend Setup
echo -e "${BLUE}Setting up Frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start Frontend in new window
echo "Starting Frontend Server in a new window..."
open_terminal "Frontend" "npm run dev"
echo -e "${GREEN}Frontend started.${NC}"

# Open Browser
echo -e "${BLUE}Opening Application...${NC}"
sleep 5 # Wait for servers to start
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:5173"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:5173"
fi

echo -e "${GREEN}Application is running! You can open it here: http://localhost:5173${NC}"
echo "Press Enter to exit the setup script..."

# Handle cleanup
cleanup() {
    echo -e "\n${BLUE}Setup script terminating. Please close the opened terminal windows to stop the servers.${NC}"
    exit
}

trap cleanup SIGINT

read -p ""
cleanup
