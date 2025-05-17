# Atlas-ERP Docker Setup Guide

This guide provides comprehensive instructions for building and running the Atlas-ERP application using Docker. The setup includes all required services: Next.js application, SurrealDB, ArangoDB, MinIO, and Temporal.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10.0 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0.0 or higher)
- At least 4GB of RAM allocated to Docker
- At least 10GB of free disk space

## Quick Start

For a quick start with default settings, run:

```bash
# Development mode
docker-compose up -d

# Production mode
docker-compose -f docker-compose.production.yml up -d
```

Then access the application at http://localhost:3000

## Configuration

### Environment Variables

The application uses environment variables for configuration. You can set these in the following ways:

1. Using a `.env` file (for development)
2. Using a `.env.production` file (for production)
3. Setting them directly in the Docker Compose files

Key environment variables:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `SURREAL_URL` | SurrealDB connection URL | `http://surrealdb:8000` |
| `SURREAL_NS` | SurrealDB namespace | `atlas` |
| `SURREAL_DB` | SurrealDB database name | `erp` |
| `SURREAL_USER` | SurrealDB username | `root` |
| `SURREAL_PASS` | SurrealDB password | `root` |
| `ARANGO_URL` | ArangoDB connection URL | `http://arangodb:8529` |
| `ARANGO_DB` | ArangoDB database name | `atlas_knowledge` |
| `ARANGO_USER` | ArangoDB username | `root` |
| `ARANGO_PASS` | ArangoDB password | `atlas` |
| `MINIO_ENDPOINT` | MinIO endpoint | `minio` |
| `MINIO_PORT` | MinIO port | `9000` |
| `MINIO_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO secret key | `minioadmin` |
| `MINIO_BUCKET` | MinIO bucket name | `atlas-erp` |
| `TEMPORAL_ADDRESS` | Temporal server address | `temporal:7233` |
| `LLM_PROVIDER` | LLM provider (e.g., openai) | `openai` |
| `LLM_API_KEY` | API key for the LLM provider | - |
| `LLM_MODEL` | Model to use (e.g., gpt-4o) | `gpt-4o` |

## Detailed Setup Instructions

### Development Mode

Development mode uses hot-reloading and is intended for development purposes.

1. Clone the repository:
   ```bash
   git clone https://github.com/KB01111/Atlas-erp-clean.git
   cd Atlas-erp-clean
   ```

2. Create a `.env` file with your configuration (or use the default one)

3. Start the development environment:
   ```bash
   docker-compose up -d
   ```

4. The application will be available at http://localhost:3000

### Production Mode

Production mode uses optimized builds and is intended for deployment.

1. Clone the repository:
   ```bash
   git clone https://github.com/KB01111/Atlas-erp-clean.git
   cd Atlas-erp-clean
   ```

2. Create a `.env.production` file with your production configuration

3. Start the production environment:
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

4. The application will be available at http://localhost:3000

## Service Access

After starting the containers, you can access the following services:

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| Atlas-ERP Application | http://localhost:3000 | N/A |
| SurrealDB | http://localhost:8001 | `root`:`root` |
| ArangoDB Web Interface | http://localhost:8529 | `root`:`atlas` |
| MinIO Console | http://localhost:9001 | `minioadmin`:`minioadmin` |
| Temporal Web UI | http://localhost:8088 | N/A |
| Prometheus (Production) | http://localhost:9090 | N/A |
| Grafana (Production) | http://localhost:3001 | `admin`:`admin` |

## Verifying the Setup

To verify that all services are running correctly, you can use the provided test script:

```bash
# Install dependencies for the test script
npm install axios minio arangojs surrealdb @temporalio/client

# Run the test script
node scripts/test-docker-setup.js
```

The script will check connectivity to all services and verify that they are properly configured.

## Troubleshooting

### Common Issues

1. **Container fails to start**
   - Check container logs: `docker-compose logs [service_name]`
   - Ensure ports are not already in use
   - Verify that Docker has enough resources allocated

2. **Connection issues between services**
   - Ensure all services are on the same Docker network
   - Check that service names in environment variables match container names
   - Verify that the services are healthy with `docker-compose ps`

3. **Database initialization fails**
   - Check the logs for the specific error: `docker-compose logs app`
   - Ensure database credentials are correct
   - Try rebuilding with clean volumes: `docker-compose down -v && docker-compose up -d`

### Viewing Logs

To view logs for all services:
```bash
docker-compose logs -f
```

To view logs for a specific service:
```bash
docker-compose logs -f [service_name]
```

## Data Persistence

All data is stored in Docker volumes:

- `surreal-data`: SurrealDB data
- `arango-data`: ArangoDB data
- `minio-data`: MinIO object storage
- `postgres-data`: PostgreSQL data for Temporal
- `prometheus-data`: Prometheus metrics (Production)
- `grafana-data`: Grafana dashboards (Production)

To back up these volumes, you can use Docker's volume backup features.

## Updating the Application

To update the application to a new version:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Rebuild and restart the containers:
   ```bash
   # Development
   docker-compose up -d --build
   
   # Production
   docker-compose -f docker-compose.production.yml up -d --build
   ```

## Security Considerations

For production deployments, consider the following security measures:

1. Change all default passwords in the `.env.production` file
2. Use a reverse proxy (like Nginx) with HTTPS
3. Restrict access to admin interfaces (ArangoDB, MinIO, etc.)
4. Set up proper network segmentation
5. Implement regular backups of all data volumes

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [SurrealDB Documentation](https://surrealdb.com/docs)
- [ArangoDB Documentation](https://www.arangodb.com/docs)
- [MinIO Documentation](https://min.io/docs/minio/container/index.html)
- [Temporal Documentation](https://docs.temporal.io)
