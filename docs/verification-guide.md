# Atlas-ERP Verification Guide

This guide provides step-by-step instructions for verifying the functionality of the Atlas-ERP application and its service connections. Follow these steps to ensure that the application is working correctly and ready for production deployment.

## Prerequisites

Before starting the verification process, make sure you have the following:

- Node.js 18+ installed
- Docker and Docker Compose installed and running
- Git repository cloned and up to date
- Required environment variables set in `.env.local` file

## 1. Service Connection Verification

The first step is to verify that all service connections are working correctly. This includes SurrealDB, ArangoDB, MinIO, and Temporal.

### Using the Comprehensive Verification Script

Run the following command to verify all aspects of the Atlas-ERP application:

```bash
node scripts/verify-atlas-erp.js
```

This enhanced script will:
- Check if the Next.js application is running
- Verify Docker container status (and start containers if needed)
- Test connections to all services (SurrealDB, ArangoDB, MinIO, Temporal)
- Check API endpoints for all major features
- Provide detailed troubleshooting tips for any issues found
- Generate a comprehensive verification summary

### Manual Verification

If you prefer to verify the connections manually, you can use the following endpoints:

- SurrealDB: http://localhost:8001/health
- ArangoDB: http://localhost:8529/_api/version
- MinIO: http://localhost:9000/minio/health/live
- Temporal: http://localhost:7233/health

## 2. Docker Environment Setup

To start the Docker environment and verify that all services are running correctly, use the following script:

```bash
node scripts/start-docker-environment.js
```

This script will:
- Check if Docker and Docker Compose are installed
- Start all services using Docker Compose
- Wait for containers to be healthy
- Check service URLs
- Provide a summary of the results

### Manual Docker Setup

If you prefer to set up the Docker environment manually, you can use the following commands:

```bash
# Start all services
docker-compose up -d

# Check container status
docker-compose ps

# View container logs
docker-compose logs -f
```

## 3. Feature Functionality Testing

To test the functionality of various features in the Atlas-ERP application, use the following script:

```bash
node scripts/test-features.js
```

This script will test:
- Dashboard components and real-time metrics
- Document upload, processing, and OCR
- Knowledge graph visualization and editing
- Workflow builder and agent configuration
- WebSocket connections for real-time updates
- Pipedream integration

### Manual Feature Testing

For a more thorough verification, you should also manually test the following features:

#### Dashboard

1. Open the application at http://localhost:3000
2. Verify that the dashboard loads correctly
3. Check that real-time metrics are updating
4. Verify that all KPI cards are displayed correctly

#### Document Management

1. Navigate to the Documents page
2. Upload a document (PDF, image, or text file)
3. Verify that the document is processed correctly
4. Test OCR functionality with an image containing text
5. Search for documents and verify that the search works

#### Knowledge Graph

1. Navigate to the Knowledge Graph page
2. Verify that the graph visualization loads correctly
3. Create a new knowledge node
4. Create connections between nodes
5. Test the search and filtering functionality
6. Verify that the graph can be exported and imported

#### Workflow Builder

1. Navigate to the Workflows page
2. Create a new workflow
3. Add nodes and connections
4. Save the workflow
5. Execute the workflow and verify the results
6. Test integration with knowledge nodes

#### Agent Configuration

1. Navigate to the Agents page
2. Create a new agent
3. Configure the agent with a prompt and tools
4. Execute the agent and verify the results
5. Test agent monitoring functionality

#### WebSocket Connections

1. Open the Network tab in your browser's developer tools
2. Filter for WebSocket connections
3. Verify that a WebSocket connection is established
4. Check that real-time updates are received

## 4. Production Readiness Verification

Before deploying to production, verify the following:

### Environment Variables

Ensure that all required environment variables are set correctly in `.env.production`:

- SurrealDB connection details
- ArangoDB connection details
- MinIO connection details
- Temporal connection details
- LLM provider and API keys

### Security

Verify that:
- All services use strong, unique credentials
- SSL/TLS is enabled for external connections
- Sensitive data is properly protected
- Authentication is implemented for all services

### Performance

Check that:
- The application loads quickly
- Real-time updates are responsive
- Document processing works efficiently
- Knowledge graph visualization handles large graphs
- Workflow execution is reliable

### Error Handling

Verify that:
- Connection errors are handled gracefully
- Service unavailability is properly detected
- Fallback mechanisms work correctly
- Error messages are clear and helpful

## 5. Production Deployment

Once all verification steps have passed, you can deploy the application to production using the production Docker configuration:

```bash
docker-compose -f docker-compose.production.yml up -d
```

This will start all services in production mode with the appropriate configuration.

## Troubleshooting

If you encounter issues during verification, check the following:

### Service Connection Issues

- Verify that all services are running
- Check service logs for errors
- Ensure that environment variables are set correctly
- Check network connectivity between services

### Feature Functionality Issues

- Check browser console for JavaScript errors
- Verify API responses in the Network tab
- Check server logs for backend errors
- Ensure that all required services are available

### Docker Issues

- Check Docker logs for container errors
- Verify that Docker has sufficient resources
- Ensure that all required ports are available
- Check for conflicting containers or services

## Conclusion

By following this verification guide, you can ensure that the Atlas-ERP application is fully functional and ready for production deployment. If all verification steps pass, the application should be reliable, secure, and performant in a production environment.
