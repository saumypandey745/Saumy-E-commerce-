#!/bin/bash
# scripts/init-multiple-postgres-dbs.sh
#
# CRIT-04: Creates multiple PostgreSQL databases from a comma-separated
# POSTGRES_MULTIPLE_DATABASES env var on first container startup.
#
# Usage: Set POSTGRES_MULTIPLE_DATABASES=order_db,payment_db in docker-compose.
# Docker mounts this script to /docker-entrypoint-initdb.d/ and runs it once.
#
# Reference: https://github.com/mrts/docker-postgresql-multiple-databases

set -e
set -u

create_database() {
    local database=$1
    echo "  Creating database: $database"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
        CREATE DATABASE $database;
        GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
EOSQL
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "==> Initializing multiple databases: $POSTGRES_MULTIPLE_DATABASES"
    for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
        create_database "$db"
    done
    echo "==> Multiple databases created successfully."
fi
