# Production Multi-Stage Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Lightweight static file server stage
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY server.js ./
COPY package.json ./

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
