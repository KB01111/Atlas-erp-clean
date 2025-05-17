#!/bin/bash

# Atlas-ERP Docker Build and Run Script
# This script builds and runs the Atlas-ERP application using Docker Compose

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${YELLOW}=== $1 ===${NC}\n"
}

# Function to print success messages
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error messages
print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if Docker is installed
if ! command_exists docker; then
  print_error "Docker is not installed. Please install Docker first."
  exit 1
fi

# Check if Docker Compose is installed
if ! command_exists docker-compose; then
  print_error "Docker Compose is not installed. Please install Docker Compose first."
  exit 1
fi

# Parse command line arguments
ENVIRONMENT="development"
REBUILD=false
CLEAN=false

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --prod|--production) ENVIRONMENT="production" ;;
    --rebuild) REBUILD=true ;;
    --clean) CLEAN=true ;;
    --help) 
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --prod, --production  Use production configuration"
      echo "  --rebuild             Force rebuild of Docker images"
      echo "  --clean               Remove all containers and volumes before building"
      echo "  --help                Show this help message"
      exit 0
      ;;
    *) print_error "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Set Docker Compose file based on environment
if [ "$ENVIRONMENT" = "production" ]; then
  COMPOSE_FILE="docker-compose.production.yml"
  print_header "Building Atlas-ERP in PRODUCTION mode"
else
  COMPOSE_FILE="docker-compose.yml"
  print_header "Building Atlas-ERP in DEVELOPMENT mode"
fi

# Check if the Docker Compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
  print_error "Docker Compose file not found: $COMPOSE_FILE"
  exit 1
fi

# Clean up if requested
if [ "$CLEAN" = true ]; then
  print_header "Cleaning up Docker containers and volumes"
  
  # Stop and remove containers
  docker-compose -f "$COMPOSE_FILE" down -v
  
  # Remove all related volumes
  docker volume rm $(docker volume ls -q | grep atlas-erp) 2>/dev/null || true
  
  print_success "Cleanup completed"
fi

# Build and start the containers
print_header "Building and starting Docker containers"

if [ "$REBUILD" = true ]; then
  # Force rebuild
  docker-compose -f "$COMPOSE_FILE" build --no-cache
  
  if [ $? -ne 0 ]; then
    print_error "Docker build failed"
    exit 1
  fi
fi

# Start the containers
docker-compose -f "$COMPOSE_FILE" up -d

if [ $? -ne 0 ]; then
  print_error "Failed to start Docker containers"
  exit 1
fi

print_success "Docker containers started successfully"

# Wait for services to be ready
print_header "Waiting for services to be ready"
echo "This may take a few minutes..."

# Wait for the Next.js app to be ready
MAX_RETRIES=30
RETRY_COUNT=0
NEXT_APP_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s http://localhost:3000/api/health >/dev/null; then
    NEXT_APP_READY=true
    break
  fi
  
  echo "Waiting for Next.js app to be ready... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
  RETRY_COUNT=$((RETRY_COUNT + 1))
  sleep 5
done

if [ "$NEXT_APP_READY" = true ]; then
  print_success "Next.js app is ready"
else
  print_error "Next.js app did not become ready in time"
fi

# Print container status
print_header "Container Status"
docker-compose -f "$COMPOSE_FILE" ps

# Print access URLs
print_header "Access URLs"
echo "Atlas-ERP Application: http://localhost:3000"
echo "MinIO Console:         http://localhost:9001"
echo "ArangoDB Web UI:       http://localhost:8529"
echo "Temporal Web UI:       http://localhost:8088"

if [ "$ENVIRONMENT" = "production" ]; then
  echo "Prometheus:            http://localhost:9090"
  echo "Grafana:               http://localhost:3001"
fi

# Print final message
print_header "Atlas-ERP is now running"
echo "To stop the application, run: docker-compose -f $COMPOSE_FILE down"
echo "To view logs, run: docker-compose -f $COMPOSE_FILE logs -f"
echo "To run tests, execute: node scripts/test-docker-setup.js"

exit 0
