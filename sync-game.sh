#!/bin/bash
# Script to backup or restore the entire game project using rclone,
# excluding heavy extracted assets and node_modules to avoid Google Drive rate limits.

REMOTE_PATH="gdrive:G-String-VN-Project"

# Exclude heavy folders, build directories, and git history
EXCLUDES=(
  --exclude "extracted_data/**"
  --exclude "extracted_data_backup/**"
  --exclude "web-app/node_modules/**"
  --exclude "web-app/dist/**"
  --exclude ".git/**"
  --exclude "*.log"
  --exclude "*.db.local_bak"
)

case "$1" in
  backup)
    echo "Backing up game project to $REMOTE_PATH..."
    rclone sync . "$REMOTE_PATH/" "${EXCLUDES[@]}" --progress
    echo "Project backup completed successfully!"
    ;;
  restore)
    echo "Restoring game project from $REMOTE_PATH..."
    rclone sync "$REMOTE_PATH/" . "${EXCLUDES[@]}" --progress
    echo "Project restore completed successfully!"
    ;;
  *)
    echo "Usage: $0 {backup|restore}"
    exit 1
    ;;
esac
