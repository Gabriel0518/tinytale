#!/bin/bash

echo "=========================================="
echo "TinyTale Local Development"
echo "=========================================="

# Backend API on port 7002
echo "Starting Backend API on http://localhost:7002 ..."
node server/index.js &
BACKEND_PID=$!

# Frontend on port 7001
echo "Starting Frontend on http://localhost:7001 ..."
npx next dev -p 7001 &
FRONTEND_PID=$!

# Admin on port 7003
echo "Starting Admin Panel on http://localhost:7003 ..."
npx next dev -p 7003 &
ADMIN_PID=$!

sleep 2
echo ""
echo "=========================================="
echo "Services Started:"
echo "  Frontend: http://localhost:7001"
echo "  Backend:  http://localhost:7002"
echo "  Admin:    http://localhost:7003/admin"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID 2>/dev/null; exit" INT TERM

wait
