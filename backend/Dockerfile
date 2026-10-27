# Production Dockerfile for Backend API
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001

# Install required build tools for native modules if needed
RUN apk add --no-cache libc6-compat

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5001

# Start the server
CMD ["node", "server.js"]
