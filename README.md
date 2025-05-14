# Atlas-ERP

Atlas-ERP is a serverless AI-first ERP system for KB Konsult & Partner AB. It leverages modern technologies to provide a comprehensive solution for business management with an enhanced user interface.

## Technologies

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts, FullCalendar, MagicUI
- **Authentication**: Clerk
- **Database**: SurrealDB
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

## Getting Started

### Development Mode

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [CopilotKit Documentation](https://docs.copilotkit.ai)
- [SurrealDB Documentation](https://surrealdb.com/docs)
- [MinIO JavaScript SDK](https://min.io/docs/minio/linux/developers/javascript/API.html)
- [Temporal Cloud Documentation](https://docs.temporal.io)
