#!/bin/bash
set -e

echo "=== Building Visual Novel Engine ==="

echo "Building for Linux (amd64)..."
GOOS=linux GOARCH=amd64 go build -o game-server cmd/server/main.go
echo "  -> game-server (Linux binary created)"

echo "Building for Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -o game-server.exe cmd/server/main.go
echo "  -> game-server.exe (Windows binary created)"

echo "=== All Builds Completed Successfully ==="
