#!/bin/bash

# Exit on error
set -e

# Function to display help
show_help() {
  echo "Atlas-ERP Build Script"
  echo ""
  echo "Usage: ./build.sh [options]"
  echo ""
  echo "Options:"
  echo "  -h, --help        Show this help message"
  echo "  -d, --dev         Build and run development environment (default)"
  echo "  -p, --prod        Build and run production environment"
  echo "  -b, --build-only  Build only, don't run"
  echo "  -c, --clean       Clean Docker volumes before building"
  echo ""
}

# Default values
ENV="dev"
BUILD_ONLY=false
CLEAN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      exit 0
      ;;
    -d|--dev)
      ENV="dev"
      shift
      ;;
    -p|--prod)
      ENV="prod"
      shift
      ;;
    -b|--build-only)
      BUILD_ONLY=true
      shift
      ;;
    -c|--clean)
      CLEAN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Set Docker Compose file based on environment
if [ "$ENV" == "dev" ]; then
  COMPOSE_FILE="docker-compose.yml"
  echo "Building development environment..."
else
  COMPOSE_FILE="docker-compose.prod.yml"
  echo "Building production environment..."
fi

# Clean volumes if requested
if [ "$CLEAN" == "true" ]; then
  echo "Cleaning Docker volumes..."
  docker compose -f $COMPOSE_FILE down -v
fi

# Build Docker images
echo "Building Docker images..."
docker compose -f $COMPOSE_FILE build

# Run Docker Compose if not build-only
if [ "$BUILD_ONLY" == "false" ]; then
  echo "Starting Docker containers..."
  docker compose -f $COMPOSE_FILE up -d
  
  echo "Containers started. You can access the application at http://localhost:3000"
  echo "To view logs, run: docker compose -f $COMPOSE_FILE logs -f"
  echo "To stop the application, run: docker compose -f $COMPOSE_FILE down"
else
  echo "Build completed. To start the application, run: docker compose -f $COMPOSE_FILE up -d"
fi
