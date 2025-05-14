#!/bin/sh
set -e

# Install necessary tools
echo "Installing necessary tools..."
apk add --no-cache wget curl

# Wait for SurrealDB to be ready
echo "Waiting for SurrealDB to be ready..."
until wget --no-verbose --tries=1 --spider http://surrealdb:8000/health; do
  echo "SurrealDB is unavailable - sleeping"
  sleep 3
done
echo "SurrealDB is up - continuing"

# Wait for ArangoDB to be ready
echo "Waiting for ArangoDB to be ready..."
until wget --no-verbose --tries=1 --spider http://arangodb:8529/_api/version; do
  echo "ArangoDB is unavailable - sleeping"
  sleep 3
done
echo "ArangoDB is up - continuing"

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
until wget --no-verbose --tries=1 --spider http://minio:9000/minio/health/live; do
  echo "MinIO is unavailable - sleeping"
  sleep 3
done
echo "MinIO is up - continuing"

# Wait for Temporal to be ready
echo "Waiting for Temporal to be ready..."
until wget --no-verbose --tries=1 --spider http://temporal:7233/health; do
  echo "Temporal is unavailable - sleeping"
  sleep 3
done
echo "Temporal is up - continuing"

# Install required packages for database initialization
echo "Installing required packages for database initialization..."
npm install --no-save surrealdb arangojs

# Initialize database schema
echo "Initializing database schema..."
node scripts/init-db-schema.js

# Start the application
echo "Starting the application..."
exec "$@"
