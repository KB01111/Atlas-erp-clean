FROM node:20-alpine
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set environment variables
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# First copy only package.json and pnpm-lock.yaml to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Clean install dependencies
RUN pnpm install --frozen-lockfile

# Then copy the rest of the application
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Start the application in development mode with React strict mode disabled
CMD ["pnpm", "dev"]
