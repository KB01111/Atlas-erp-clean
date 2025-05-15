FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1

# First copy only package.json and pnpm-lock.yaml to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Clean install dependencies including devDependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Start the application in development mode
CMD ["pnpm", "dev"]

# Production build stage
FROM base AS builder
ENV NODE_ENV=production

# Clean install dependencies excluding devDependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy the rest of the application
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install curl for healthchecks and other dependencies
RUN apk add --no-cache curl

# Copy standalone output
COPY --from=builder /app/dist/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/dist/static ./dist/static
COPY --from=builder /app/server.js ./

# Install Socket.io for the custom server
RUN npm install socket.io@4.8.1 && \
    npm cache clean --force

# Set proper permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application with the custom server
CMD ["node", "server.js"]
