#!/bin/bash
set -e

# Parse arguments
USE_UPX=false
for arg in "$@"; do
  if [ "$arg" == "-upx" ] || [ "$arg" == "--upx" ]; then
    USE_UPX=true
  fi
done

echo "=== Building Visual Novel Engine ==="

# Remove existing binaries to force a clean build
rm -f G弦上的魔王-server G弦上的魔王.exe

echo "Building for Linux (amd64)..."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o G弦上的魔王-server cmd/server/main.go
echo "  -> G弦上的魔王-server (Linux binary created)"

echo "Building for Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o G弦上的魔王.exe cmd/server/main.go
echo "  -> G弦上的魔王.exe (Windows binary created)"

if [ "$USE_UPX" = true ]; then
  echo "=== Compressing Binaries with UPX ==="
  if command -v upx &> /dev/null; then
    upx --best G弦上的魔王-server
    upx --best G弦上的魔王.exe
    echo "=== Compression Completed ==="
  else
    echo "Warning: UPX is not installed. Skipping compression."
  fi
else
  echo "=== Skipping UPX compression (run with -upx or --upx to compress) ==="
fi

echo "=== All Builds Completed Successfully ==="
