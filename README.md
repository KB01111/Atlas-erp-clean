# Atlas-ERP

Atlas-ERP is a serverless AI-first ERP system for KB Konsult & Partner AB. It leverages modern technologies to provide a comprehensive solution for business management with an enhanced user interface.

## Technologies

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts, FullCalendar, MagicUI
- **Authentication**: Clerk
- **Database**: SurrealDB, ArangoDB (Knowledge Graph)
- **Storage**: MinIO
- **AI Agents**: Mastra
- **Workflow Orchestration**: Temporal Cloud
- **AI Integration**: CopilotKit for Generative UI, LiteLLM for multi-provider LLM support
- **UI Components**: Custom MagicUI components for enhanced visual experience

## Features

- **Dashboard**: Interactive KPI cards, system status panel, and agent actions
- **Calendar**: Event management with AI integration
- **Documents**: Document management with AI search capabilities
- **AI Agents**: CFO-Bot, Ops-Bot, and Soshie-Bot for specialized business functions
- **Settings**: Comprehensive settings for LLM configuration, database, and integrations
- **Enhanced UI**: Modern, interactive UI with MagicUI components
- **Knowledge Graph**: Visualization and management of knowledge relationships
- **Real-time Updates**: WebSocket integration for live data updates

## Getting Started

### Development Mode

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Configuration

The application requires several environment variables to be set. A sample `.env` file is provided with default values for development. Key environment variables include:

- `OPENAI_API_KEY`: Your OpenAI API key for LLM functionality
- `LLM_API_KEY`: API key for LiteLLM integration
- `SURREAL_URL`, `ARANGO_URL`, etc.: Connection details for databases
- `TEMPORAL_ADDRESS`: Address for Temporal workflow service
- `USE_MOCK_SERVICES`: Set to "true" to use mock services instead of real ones

### Docker Setup

You can run the entire application stack using Docker Compose with our convenient build scripts:

#### Using the Build Scripts

For Linux/macOS:
```bash
# Development environment
./scripts/build-and-run.sh

# Production environment
./scripts/build-and-run.sh -e prod -b

# Clean, build, and run production environment
./scripts/build-and-run.sh -e prod -b -c
```

For Windows:
```cmd
# Development environment
scripts\build-and-run.bat

# Production environment
scripts\build-and-run.bat -e prod -b

# Clean, build, and run production environment
scripts\build-and-run.bat -e prod -b -c
```

#### Manual Docker Commands

Alternatively, you can use Docker Compose commands directly:

##### Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

##### Production Environment

```bash
# Start all services in production mode
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop all services
docker-compose -f docker-compose.production.yml down
```

The application will be available at [http://localhost:3000](http://localhost:3000).

#### Additional Services

- **MinIO Console**: [http://localhost:9001](http://localhost:9001)
- **Temporal UI**: [http://localhost:8088](http://localhost:8088)
- **ArangoDB UI**: [http://localhost:8529](http://localhost:8529)
- **Grafana Dashboard** (Production only): [http://localhost:3001](http://localhost:3001)
- **Prometheus** (Production only): [http://localhost:9090](http://localhost:9090)

## UI Components

Atlas-ERP uses custom MagicUI components to create a modern, interactive user interface:

- **ShimmerButton**: Enhanced buttons with shimmer effect
- **MagicCard**: Interactive cards with 3D rotation effect
- **AnimatedGridPattern**: Animated background patterns
- **AnimatedGradientText**: Text with animated gradient effect
- **ScrollProgress**: Progress indicator for page scrolling
- **ShineBorder**: Borders with animated shine effect
- **AnimatedBeam**: Animated connections between elements

## Docker Health Checks and Troubleshooting

When running the application with Docker, you may notice that some health checks report services as unhealthy, even though the services are actually running and accessible. This is a known issue with the current health check configuration.

### Known Health Check Issues

- **Temporal Health Check**: The Temporal health check may show as unhealthy in Docker, but the service is running and accessible at http://localhost:8088.
- **ArangoDB Health Check**: ArangoDB may show as unhealthy, but it's accessible from the application at http://localhost:8529.
- **SurrealDB Health Check**: SurrealDB may show as unhealthy, but it's accessible from the application.

### Verifying Service Functionality

You can use the provided verification scripts to check if all services are working correctly, regardless of Docker health check status:

For Linux/macOS:
```bash
# Make the script executable
chmod +x scripts/verify-services.sh

# Run the verification script
./scripts/verify-services.sh
```

For Windows:
```cmd
# Run the verification script
scripts\verify-services.bat
```

Or directly with Node.js:
```bash
# Run the verification script
node scripts/verify-services.js
```

This script performs application-level checks that are more reliable than Docker health checks and will provide a detailed report of service status.

Alternatively, you can manually verify each service:

1. **SurrealDB**: Access the application and check the status panel on the dashboard. If it shows SurrealDB as "operational", the service is working.
2. **ArangoDB**: Navigate to http://localhost:8529 in your browser. You should see the ArangoDB web interface.
3. **Temporal**: Navigate to http://localhost:8088 in your browser. You should see the Temporal UI.

### Recent Configuration Changes

Recent updates to the Docker configuration include:

- **OpenAI API Key**: Added the OPENAI_API_KEY environment variable to both the .env file and Docker Compose configuration.
- **Temporal Configuration**: Updated with TEMPORAL_CLI_ADDRESS and SERVICES environment variables for better service discovery.
- **SurrealDB Memory Mode**: SurrealDB now runs in memory mode for more reliable development experience.

### Troubleshooting Tips

If you encounter issues with the services:

1. Check container logs: `docker-compose logs [service_name]`
2. Ensure all environment variables are set correctly in your .env file
3. Try restarting specific services: `docker-compose restart [service_name]`
4. For persistent issues, try a clean rebuild: `docker-compose down -v && docker-compose up -d`

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [CopilotKit Documentation](https://docs.copilotkit.ai)
- [SurrealDB Documentation](https://surrealdb.com/docs)
- [ArangoDB Documentation](https://www.arangodb.com/docs/stable/)
- [MinIO JavaScript SDK](https://min.io/docs/minio/linux/developers/javascript/API.html)
- [Temporal Cloud Documentation](https://docs.temporal.io)
