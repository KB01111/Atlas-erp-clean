# Atlas-ERP Verification Scripts

This directory contains scripts for verifying the functionality of the Atlas-ERP application and its service connections.

## Available Scripts

### 1. `install-verification-deps.js`

Installs the necessary dependencies for the verification scripts.

```bash
node scripts/install-verification-deps.js
```

### 2. `verify-atlas-erp.js`

Comprehensive verification script that checks all aspects of the Atlas-ERP application.

```bash
node scripts/verify-atlas-erp.js
```

This script tests:
- Next.js application status
- Docker container status
- SurrealDB connection
- ArangoDB connection
- MinIO connection
- Temporal connection
- API endpoints for all major features
- Provides troubleshooting tips for any issues found

The script can also automatically start Docker containers if they're not running.

### 3. `start-docker-environment.js`

Starts the Docker environment and verifies that all services are running correctly.

```bash
node scripts/start-docker-environment.js
```

This script:
- Checks if Docker and Docker Compose are installed
- Starts all services using Docker Compose
- Waits for containers to be healthy
- Checks service URLs

### 4. `test-features.js`

Tests the functionality of various features in the Atlas-ERP application.

```bash
node scripts/test-features.js
```

This script tests:
- Dashboard components and real-time metrics
- Document upload, processing, and OCR
- Knowledge graph visualization and editing
- Workflow builder and agent configuration
- WebSocket connections for real-time updates
- Pipedream integration

## Usage

1. First, install the required dependencies:

```bash
node scripts/install-verification-deps.js
```

2. Start the Docker environment:

```bash
node scripts/start-docker-environment.js
```

3. Verify service connections:

```bash
node scripts/verify-atlas-erp.js
```

4. Test application features:

```bash
node scripts/test-features.js
```

## Troubleshooting

If you encounter issues during verification, check the following:

### Service Connection Issues

- Verify that all services are running
- Check service logs for errors
- Ensure that environment variables are set correctly
- Check network connectivity between services

### Docker Issues

- Check Docker logs for container errors
- Verify that Docker has sufficient resources
- Ensure that all required ports are available
- Check for conflicting containers or services

### Feature Functionality Issues

- Check browser console for JavaScript errors
- Verify API responses in the Network tab
- Check server logs for backend errors
- Ensure that all required services are available

For more detailed troubleshooting, refer to the [Verification Guide](../docs/verification-guide.md).
