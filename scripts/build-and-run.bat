@echo off
setlocal enabledelayedexpansion

:: Default values
set ENV=dev
set BUILD=false
set CLEAN=false

:: Parse command line arguments
:parse_args
if "%~1"=="" goto :validate_args
if /i "%~1"=="-e" (
    set ENV=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="--env" (
    set ENV=%~2
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-b" (
    set BUILD=true
    shift
    goto :parse_args
)
if /i "%~1"=="--build" (
    set BUILD=true
    shift
    goto :parse_args
)
if /i "%~1"=="-c" (
    set CLEAN=true
    shift
    goto :parse_args
)
if /i "%~1"=="--clean" (
    set CLEAN=true
    shift
    goto :parse_args
)
if /i "%~1"=="-h" (
    goto :show_help
)
if /i "%~1"=="--help" (
    goto :show_help
)
echo Unknown option: %~1
goto :show_help

:validate_args
:: Validate environment
if /i not "%ENV%"=="dev" if /i not "%ENV%"=="prod" (
    echo Error: Environment must be 'dev' or 'prod'
    exit /b 1
)

:: Set Docker Compose file based on environment
if /i "%ENV%"=="prod" (
    set COMPOSE_FILE=docker-compose.production.yml
    set ENV_FILE=.env.production
    set DOCKERFILE=Dockerfile.production
) else (
    set COMPOSE_FILE=docker-compose.yml
    set ENV_FILE=.env
    set DOCKERFILE=Dockerfile
)

:: Check if environment file exists
if not exist "%ENV_FILE%" (
    echo Warning: %ENV_FILE% does not exist. Creating from example file...
    if exist "%ENV_FILE%.example" (
        copy "%ENV_FILE%.example" "%ENV_FILE%"
        echo Created %ENV_FILE% from example file. Please edit it with your configuration.
    ) else (
        echo Error: %ENV_FILE%.example does not exist. Please create %ENV_FILE% manually.
        exit /b 1
    )
)

:: Clean up if requested
if "%CLEAN%"=="true" (
    echo Cleaning up existing containers and volumes...
    docker-compose -f "%COMPOSE_FILE%" down -v
    echo Cleanup complete.
)

:: Build if requested
if "%BUILD%"=="true" (
    echo Building Docker images for %ENV% environment...
    if /i "%ENV%"=="prod" (
        :: For production, use the production Dockerfile
        docker-compose -f "%COMPOSE_FILE%" build --build-arg DOCKERFILE="%DOCKERFILE%"
    ) else (
        docker-compose -f "%COMPOSE_FILE%" build
    )
    echo Build complete.
)

:: Run the containers
echo Starting Atlas-ERP in %ENV% environment...
docker-compose -f "%COMPOSE_FILE%" up -d

:: Display container status
echo Container status:
docker-compose -f "%COMPOSE_FILE%" ps

:: Display access information
echo.
echo Atlas-ERP is now running!
echo Access the application at: http://localhost:3000
if /i "%ENV%"=="prod" (
    echo MinIO Console: http://localhost:9001
    echo Temporal UI: http://localhost:8088
    echo Grafana Dashboard: http://localhost:3001
    echo Prometheus: http://localhost:9090
) else (
    echo MinIO Console: http://localhost:9001
    echo Temporal UI: http://localhost:8088
)

echo.
echo To view logs, run: docker-compose -f %COMPOSE_FILE% logs -f
echo To stop the application, run: docker-compose -f %COMPOSE_FILE% down
goto :eof

:show_help
echo Atlas-ERP Docker Build and Run Script
echo.
echo Usage: %0 [options]
echo.
echo Options:
echo   -e, --env ENV       Environment to use (dev or prod, default: dev)
echo   -b, --build         Build the Docker images before running
echo   -c, --clean         Clean up existing containers and volumes before running
echo   -h, --help          Show this help message
echo.
echo Examples:
echo   %0                  Run the development environment
echo   %0 -e prod          Run the production environment
echo   %0 -e prod -b       Build and run the production environment
echo   %0 -e prod -b -c    Clean, build, and run the production environment
exit /b 0
