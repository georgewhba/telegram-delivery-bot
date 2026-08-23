#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

BACKUP_DIR="${BACKUP_DIR:-/backups/delivery-bot}"
DB_PATH="${DATABASE_PATH:-$PROJECT_DIR/data/bot.db}"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB_PATH" ]; then
  echo "❌ Database not found at $DB_PATH"
  exit 1
fi

# Use SQLite's online backup (via .backup) instead of a raw cp so we never
# copy a file mid-write while the bot is running.
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/bot_$DATE.db'"
else
  cp "$DB_PATH" "$BACKUP_DIR/bot_$DATE.db"
fi

# Keep only the last 30 backups
ls -t "$BACKUP_DIR"/bot_*.db 2>/dev/null | tail -n +31 | xargs -r rm -f

echo "✅ Backup completed: bot_$DATE.db"
