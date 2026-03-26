#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# GramSeva Health — One-command startup
# Usage: ./start.sh
# Opens: http://localhost:5173  (frontend)
#         http://localhost:8000  (AI triage backend)
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$SCRIPT_DIR/ai-models/skin/.venv/bin/activate"

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${CYAN}"
echo "  ██████╗ ██████╗  █████╗ ███╗   ███╗███████╗███████╗██╗   ██╗ █████╗ "
echo "  ██╔════╝ ██╔══██╗██╔══██╗████╗ ████║██╔════╝██╔════╝██║   ██║██╔══██╗"
echo "  ██║  ███╗██████╔╝███████║██╔████╔██║███████╗█████╗  ██║   ██║███████║"
echo "  ██║   ██║██╔══██╗██╔══██║██║╚██╔╝██║╚════██║██╔══╝  ╚██╗ ██╔╝██╔══██║"
echo "  ╚██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║███████║███████╗ ╚████╔╝ ██║  ██║"
echo "   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝  ╚═══╝  ╚═╝  ╚═╝"
echo -e "                         Health Platform${NC}"
echo ""

# ── Check requirements ────────────────────────────────────────────────────────
if [ ! -f "$VENV" ]; then
    echo -e "${YELLOW}⚠  Python venv not found. Run:${NC}"
    echo "   cd ai-models/skin && python3 -m venv .venv && source .venv/bin/activate"
    echo "   pip install -r requirements.txt"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/node_modules/.bin/vite" ]; then
    echo -e "${YELLOW}⚠  node_modules missing. Running npm install...${NC}"
    cd "$SCRIPT_DIR" && npm install
fi

# ── Trap SIGINT to kill all children on Ctrl+C ────────────────────────────────
cleanup() {
    echo -e "\n${YELLOW}Shutting down all servers...${NC}"
    kill 0
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── Start Backend (port 8000) ─────────────────────────────────────────────────
echo -e "${GREEN}▶  Starting AI Triage Backend → http://localhost:8000${NC}"
(
    source "$VENV"
    cd "$SCRIPT_DIR/ai-models"
    uvicorn server:app --reload --port 8000 --host 0.0.0.0
) &
BACKEND_PID=$!

# Give backend a moment to start
sleep 2

# ── Start Skin Backend (port 8001) ────────────────────────────────────────────
echo -e "${GREEN}▶  Starting AI Skin Backend   → http://localhost:8001${NC}"
(
    source "$VENV"
    cd "$SCRIPT_DIR/ai-models/skin"
    uvicorn skin_server:app --reload --port 8001 --host 0.0.0.0
) &
SKIN_PID=$!

# Give skin backend a moment to start
sleep 2

# ── Start Frontend (port 5173) ────────────────────────────────────────────────
echo -e "${GREEN}▶  Starting React Frontend    → http://localhost:5173${NC}"
(
    cd "$SCRIPT_DIR"
    npm run dev
) &
FRONTEND_PID=$!

echo ""
echo -e "${CYAN}────────────────────────────────────────────────────${NC}"
echo -e "${GREEN}  ✅  GramSeva Health is running!${NC}"
echo -e "${CYAN}  🌐  Frontend : http://localhost:5173${NC}"
echo -e "${CYAN}  🤖  Triage   : http://localhost:8000${NC}"
echo -e "${CYAN}  🔬  Skin AI  : http://localhost:8001${NC}"
echo -e "${CYAN}  📋  API Docs : http://localhost:8000/docs${NC}"
echo -e "${CYAN}────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}  Press Ctrl+C to stop all servers${NC}"
echo ""

# ── Wait ─────────────────────────────────────────────────────────────────────
wait
