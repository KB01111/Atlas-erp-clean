#!/bin/bash
set -e

# Function to display help
show_help() {
  echo "Atlas-ERP Docker Build and Run Script"
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  -e, --env ENV       Environment to use (dev or prod, default: dev)"
  echo "  -b, --build         Build the Docker images before running"
  echo "  -c, --clean         Clean up existing containers and volumes before running"
  echo "  -h, --help          Show this help message"
  echo ""
  echo "Examples:"
  echo "  $0                  Run the development environment"
  echo "  $0 -e prod          Run the production environment"
  echo "  $0 -e prod -b       Build and run the production environment"
  echo "  $0 -e prod -b -c    Clean, build, and run the production environment"
}

# Default values
ENV="dev"
BUILD=false
CLEAN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env)
      ENV="$2"
      shift 2
      ;;
    -b|--build)
      BUILD=true
      shift
      ;;
    -c|--clean)
      CLEAN=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate environment
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Error: Environment must be 'dev' or 'prod'"
  exit 1
fi

# Set Docker Compose file based on environment
if [[ "$ENV" == "prod" ]]; then
  COMPOSE_FILE="docker-compose.production.yml"
  ENV_FILE=".env.production"
  DOCKERFILE="Dockerfile.production"
else
  COMPOSE_FILE="docker-compose.yml"
  ENV_FILE=".env"
  DOCKERFILE="Dockerfile"
fi

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Warning: $ENV_FILE does not exist. Creating from example file..."
  if [[ -f "$ENV_FILE.example" ]]; then
    cp "$ENV_FILE.example" "$ENV_FILE"
    echo "Created $ENV_FILE from example file. Please edit it with your configuration."
  else
    echo "Error: $ENV_FILE.example does not exist. Please create $ENV_FILE manually."
    exit 1
  fi
fi

# Clean up if requested
if [[ "$CLEAN" == true ]]; then
  echo "Cleaning up existing containers and volumes..."
  docker-compose -f "$COMPOSE_FILE" down -v
  echo "Cleanup complete."
fi

# Build if requested
if [[ "$BUILD" == true ]]; then
  echo "Building Docker images for $ENV environment..."
  if [[ "$ENV" == "prod" ]]; then
    # For production, use the production Dockerfile
    docker-compose -f "$COMPOSE_FILE" build --build-arg DOCKERFILE="$DOCKERFILE"
  else
    docker-compose -f "$COMPOSE_FILE" build
  fi
  echo "Build complete."
fi

# Run the containers
echo "Starting Atlas-ERP in $ENV environment..."
docker-compose -f "$COMPOSE_FILE" up -d

# Display container status
echo "Container status:"
docker-compose -f "$COMPOSE_FILE" ps

# Display access information
echo ""
echo "Atlas-ERP is now running!"
echo "Access the application at: http://localhost:3000"
if [[ "$ENV" == "prod" ]]; then
  echo "MinIO Console: http://localhost:9001"
  echo "Temporal UI: http://localhost:8088"
  echo "Grafana Dashboard: http://localhost:3001"
  echo "Prometheus: http://localhost:9090"
else
  echo "MinIO Console: http://localhost:9001"
  echo "Temporal UI: http://localhost:8088"
fi

echo ""
echo "To view logs, run: docker-compose -f $COMPOSE_FILE logs -f"
echo "To stop the application, run: docker-compose -f $COMPOSE_FILE down"
