#!/bin/bash
# Database Initialization Script for Atlas-ERP
# This script initializes the database schema for both SurrealDB and ArangoDB

set -e

echo "=== Atlas-ERP Database Initialization ==="

# Install required packages
echo "Installing required packages..."
npm install --no-save surrealdb arangojs

# Run the initialization script
echo "Running database schema initialization..."
node scripts/init-db-schema.js

echo "Database initialization completed successfully"
