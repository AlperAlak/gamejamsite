# Multi-stage Dockerfile for Node.js Enterprise App
# ───────────────────────────────────────────────────

# 1. Base Strategy
FROM node:18-alpine AS base
WORKDIR /usr/src/app
# Set timezone (for Istanbul, since it's Karadeniz Game Jam)
ENV TZ=Europe/Istanbul

# 2. Builder Strategy (Install all dependencies)
FROM base AS builder
COPY package*.json ./
# Install ALL dependencies (including dev) for building if needed
RUN npm install

# 3. Production Strategy (Slim down the image)
FROM base AS production
ENV NODE_ENV=production

# Copy package descriptors
COPY package*.json ./
# Install ONLY production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy the bare minimum required folders
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

# Secure the app by running as a non-root user built into the Alpine image
USER node

EXPOSE 3000

# Start Application
CMD ["npm", "start"]
