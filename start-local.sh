#!/bin/bash

echo "=========================================="
echo "TinyTale Local Deployment"
echo "=========================================="

# Frontend on port 7001
echo "Starting Frontend on http://localhost:7001 ..."
npm run dev -- -p 7001 &

# Store the PIDs
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "Services Started:"
echo "  Frontend: http://localhost:7001"
echo "  Admin:    http://localhost:7001/admin"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
