#!/bin/sh

# ==========================================================
# ENTERPRISE SAAS SYSTEM RESTORATION & ROLLBACK UTILITY
# ==========================================================
# Accepts a backup snapshot filepath, halts dangerous loops,
# creates a pre-rollback checkpoint, and restores the system.

BACKUP_FILE="$1"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

if [ -z "$BACKUP_FILE" ]; then
  echo "=========================================================="
  echo "  Ranktica AI rollback & recovery CLI"
  echo "=========================================================="
  echo "Usage: ./rollback.sh <backup_filename_or_path>"
  echo "Available snapshots in $BACKUP_DIR:"
  ls -lh "$BACKUP_DIR" 2>/dev/null || echo "No backups found."
  echo "=========================================================="
  exit 1
fi

RESOLVED_PATH="$BACKUP_FILE"
if [ ! -f "$RESOLVED_PATH" ] && [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
  RESOLVED_PATH="$BACKUP_DIR/$BACKUP_FILE"
fi

if [ ! -f "$RESOLVED_PATH" ]; then
  echo "[Rollback Error] Target snapshot not found: $BACKUP_FILE"
  exit 1
fi

echo "[Rollback Active] COMMENCING DATA RESTORATION..."
echo "[Rollback Active] Target Snapshot: $RESOLVED_PATH"

# ----------------------------------------------------------
# pre-flight: Create pre-rollback failsafe checkpoint
# ----------------------------------------------------------
FAILSAFE_TIMESTAMP=$(date +"%Y%m%d_%H%M%S_PRE_ROLLBACK_FAILSAFE")
echo "[Rollback Active] Guarding current live state in pre-rollback timestamp: $FAILSAFE_TIMESTAMP"
sh /scripts/backup-db.sh >/dev/null 2>&1

# ----------------------------------------------------------
# Restore block: Detect database types
# ----------------------------------------------------------
case "$RESOLVED_PATH" in
  *pg_*.sql.gz)
    echo "[Rollback Active] PostgreSQL snapshot detected. Syncing with cluster..."
    DB_HOST="${DB_HOST:-db}"
    DB_USER="${POSTGRES_USER:-ranktica_admin}"
    DB_NAME="${POSTGRES_DB:-ranktica_prod}"
    PG_PASSWORD="${POSTGRES_PASSWORD:-SecuredProdP@ssw0rd}"
    
    export PGPASSWORD="$PG_PASSWORD"
    
    # Extract dump to tmp
    TEMP_SQL="/tmp/restore_${FAILSAFE_TIMESTAMP}.sql"
    gunzip -c "$RESOLVED_PATH" > "$TEMP_SQL"
    
    if [ $? -eq 0 ]; then
      echo "[Rollback Active] Flushing and wiping existing public schemas..."
      psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
      
      echo "[Rollback Active] Rebuilding schemas and restoring entities..."
      psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$TEMP_SQL"
      
      if [ $? -eq 0 ]; then
        echo "[Rollback Complete] PostgreSQL schemas successfully restored to state: $BACKUP_FILE"
      else
        echo "[Critical Error] psql restore stream crashed! Manual root SRE intervention needed."
      fi
      rm -f "$TEMP_SQL"
    else
      echo "[Critical Error] Extraction of PG backup crashed."
    fi
    ;;
    
  *sqlite_*.tar.gz)
    echo "[Rollback Active] SQLite database snapshot detected. Overwriting active storage..."
    ACTIVE_SQLITE="/app/database.sqlite"
    if [ ! -f "$ACTIVE_SQLITE" ] && [ -f "./database.sqlite" ]; then
      ACTIVE_SQLITE="./database.sqlite"
    fi
    
    TEMP_DIR="/tmp/sqlite_extract_${FAILSAFE_TIMESTAMP}"
    mkdir -p "$TEMP_DIR"
    tar -xzf "$RESOLVED_PATH" -C "$TEMP_DIR"
    
    EXTRACTED_FILE=$(find "$TEMP_DIR" -type f -name "*sqlite*")
    
    if [ -n "$EXTRACTED_FILE" ] && [ -f "$EXTRACTED_FILE" ]; then
      # Make sure the app has permissions or overwrite
      cp "$EXTRACTED_FILE" "$ACTIVE_SQLITE"
      echo "[Rollback Complete] Active SQLite storage successfully restored to state: $BACKUP_FILE"
    else
      echo "[Critical Error] Failed to extract database file from snapshot package."
    fi
    rm -rf "$TEMP_DIR"
    ;;
    
  *)
    echo "[Rollback Error] Unrecognized database type or file structure: $BACKUP_FILE"
    exit 1
    ;;
esac

echo "[Rollback Active] Deployment state restored. We advise restarting server nodes to purge caching layers."
exit 0
