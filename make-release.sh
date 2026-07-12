#!/bin/bash
set -e

# Path to the VERSION file
VERSION_FILE="VERSION"

# Initialize VERSION file if it does not exist
if [ ! -f "$VERSION_FILE" ]; then
  echo "v5" > "$VERSION_FILE"
  echo "Created $VERSION_FILE with default version v5"
fi

# Read version (trim whitespace)
VERSION=$(cat "$VERSION_FILE" | xargs)

echo "=== Packaging Release $VERSION ==="

# Build the binaries (forwards arguments like -upx)
./build.sh "$@"

# Create releases directory if it doesn't exist
mkdir -p releases

# Define target paths
LINUX_RELEASE="releases/the-devil-on-g-string-${VERSION}.amd64.linux"
WINDOWS_RELEASE="releases/the-devil-on-g-string-${VERSION}.exe"

# Copy the built binaries to the releases directory
cp G弦上的魔王-server "$LINUX_RELEASE"
cp G弦上的魔王.exe "$WINDOWS_RELEASE"

echo "=== Release $VERSION Successfully Created ==="
echo "  -> $LINUX_RELEASE"
echo "  -> $WINDOWS_RELEASE"
