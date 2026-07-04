#!/bin/bash
set -e

echo "=== Building Visual Novel Engine ==="

echo "Building for Linux (amd64)..."
GOOS=linux GOARCH=amd64 go build -o G弦上的魔王-server cmd/server/main.go
echo "  -> G弦上的魔王-server (Linux binary created)"

echo "Building for Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -o G弦上的魔王.exe cmd/server/main.go
echo "  -> G弦上的魔王.exe (Windows binary created)"

echo "=== All Builds Completed Successfully ==="
