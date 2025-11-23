# Use official Bun image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Production stage
FROM base AS production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/drizzle.tenant.config.ts ./drizzle.tenant.config.ts

# Create data directory
RUN mkdir -p /app/data/tenants

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Run the app
CMD ["bun", "run", "start"]
