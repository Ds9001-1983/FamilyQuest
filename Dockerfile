FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install build tooling for native deps (bcrypt).
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json drizzle.config.ts ./
COPY server ./server
COPY shared ./shared

RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && npm ci --omit=dev \
  && apt-get purge -y python3 make g++ && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist

EXPOSE 5000
USER node
CMD ["node", "dist/index.js"]
