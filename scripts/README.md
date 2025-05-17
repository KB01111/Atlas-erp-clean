# Atlas-ERP Scripts

This directory contains utility scripts for the Atlas-ERP application, including verification, testing, and development tools.

## Available Scripts

### 1. `eslint-autofix.js`

Automatically fixes ESLint issues in the codebase.

```bash
# Fix all ESLint issues in the project
node scripts/eslint-autofix.js

# Fix only TypeScript-related issues
node scripts/eslint-autofix.js --type-only

# Show what would be fixed without making changes
node scripts/eslint-autofix.js --dry-run

# Fix issues in a specific directory
node scripts/eslint-autofix.js src/components
```

You can also use the npm scripts:

```bash
# Fix all ESLint issues
pnpm lint:fix

# Fix only TypeScript-related issues
pnpm lint:fix:type
```

### 2. `install-verification-deps.js`

Installs the necessary dependencies for the verification scripts.

```bash
node scripts/install-verification-deps.js
```

### 3. `verify-atlas-erp.js`

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

### 4. `start-docker-environment.js`

Starts the Docker environment and verifies that all services are running correctly.

```bash
node scripts/start-docker-environment.js
```

This script:
- Checks if Docker and Docker Compose are installed
- Starts all services using Docker Compose
- Waits for containers to be healthy
- Checks service URLs

### 5. `test-features.js`

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
