# Atlas-ERP Build Script for Windows

# Function to display help
function Show-Help {
  Write-Host "Atlas-ERP Build Script"
  Write-Host ""
  Write-Host "Usage: .\build.ps1 [options]"
  Write-Host ""
  Write-Host "Options:"
  Write-Host "  -Help        Show this help message"
  Write-Host "  -Dev         Build and run development environment (default)"
  Write-Host "  -Prod        Build and run production environment"
  Write-Host "  -BuildOnly   Build only, don't run"
  Write-Host "  -Clean       Clean Docker volumes before building"
  Write-Host ""
}

# Parse arguments
param(
  [switch]$Help,
  [switch]$Dev,
  [switch]$Prod,
  [switch]$BuildOnly,
  [switch]$Clean
)

# Show help if requested
if ($Help) {
  Show-Help
  exit 0
}

# Default values
$Env = "dev"
if ($Prod) {
  $Env = "prod"
}

# Set Docker Compose file based on environment
if ($Env -eq "dev") {
  $ComposeFile = "docker-compose.yml"
  Write-Host "Building development environment..."
} else {
  $ComposeFile = "docker-compose.prod.yml"
  Write-Host "Building production environment..."
}

# Clean volumes if requested
if ($Clean) {
  Write-Host "Cleaning Docker volumes..."
  docker compose -f $ComposeFile down -v
}

# Build Docker images
Write-Host "Building Docker images..."
docker compose -f $ComposeFile build

# Run Docker Compose if not build-only
if (-not $BuildOnly) {
  Write-Host "Starting Docker containers..."
  docker compose -f $ComposeFile up -d
  
  Write-Host "Containers started. You can access the application at http://localhost:3000"
  Write-Host "To view logs, run: docker compose -f $ComposeFile logs -f"
  Write-Host "To stop the application, run: docker compose -f $ComposeFile down"
} else {
  Write-Host "Build completed. To start the application, run: docker compose -f $ComposeFile up -d"
}
