#!/bin/sh

# ==========================================================
# ENTERPRISE SAAS DATABASE BACKUP TASK
# ==========================================================
# This script handles transactional backups of sqlite or pgsql databases.
# It compresses states, logs stats, and prunes items older than 14 days.

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS=14
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

echo "[Backup Daemon] Initiating system-wide database scan at $(date)..."

# ----------------------------------------------------------
# PATTERN A: postgresql backup (If env params are active)
# ----------------------------------------------------------
if [ -n "$POSTGRES_DB" ] || [ -n "$DATABASE_URL" ]; then
  DB_HOST="${DB_HOST:-db}"
  DB_USER="${POSTGRES_USER:-ranktica_admin}"
  DB_NAME="${POSTGRES_DB:-ranktica_prod}"
  PG_PASSWORD="${POSTGRES_PASSWORD:-SecuredProdP@ssw0rd}"
  
  export PGPASSWORD="$PG_PASSWORD"
  PG_BACKUP_FILE="$BACKUP_DIR/pg_${DB_NAME}_${TIMESTAMP}.sql"
  
  echo "[Backup Daemon] PostgreSQL cluster discovered. Dumping schemas..."
  pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -F p -f "$PG_BACKUP_FILE"
  
  if [ $? -eq 0 ]; then
    gzip -9 "$PG_BACKUP_FILE"
    echo "[Backup Daemon] PostgreSQL backup successfully compressed: ${PG_BACKUP_FILE}.gz"
  else
    echo "[Backup Error] PostgreSQL schema dump crashed! Falling back..."
    rm -f "$PG_BACKUP_FILE"
  fi
fi

# ----------------------------------------------------------
# PATTERN B: SQLite database backup (Safe fallback or standalones)
# ----------------------------------------------------------
SQLITE_PATH="/app/database.sqlite"
if [ ! -f "$SQLITE_PATH" ] && [ -f "./database.sqlite" ]; then
  SQLITE_PATH="./database.sqlite"
fi

if [ -f "$SQLITE_PATH" ]; then
  echo "[Backup Daemon] SQLite database file discovered. Hot-copying database..."
  SQLITE_BACKUP_FILE="$BACKUP_DIR/sqlite_fallback_${TIMESTAMP}.sqlite"
  
  # Hot copy using native sqlite .backup to avoid transactional corruption locks
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$SQLITE_PATH" ".backup '$SQLITE_BACKUP_FILE'"
  else
    cp "$SQLITE_PATH" "$SQLITE_BACKUP_FILE"
  fi
  
  tar -czf "${SQLITE_BACKUP_FILE}.tar.gz" -C "$BACKUP_DIR" "$(basename "$SQLITE_BACKUP_FILE")"
  rm -f "$SQLITE_BACKUP_FILE"
  echo "[Backup Daemon] SQLite backup successfully compressed: ${SQLITE_BACKUP_FILE}.tar.gz"
fi

# ----------------------------------------------------------
# PATTERN C: Prune Archives older than 14 days
# ----------------------------------------------------------
echo "[Backup Daemon] Purging snapshots older than $RETENTION_DAYS days based on S_SLA constraints..."
find "$BACKUP_DIR" -type f \( -name "*.gz" -o -name "*.tar.gz" \) -mtime +$RETENTION_DAYS -print -delete

echo "[Backup Daemon] Backup suite complete at $(date)."
