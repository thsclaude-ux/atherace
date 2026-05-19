FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN npm ci --workspace=@atr/shared --workspace=@atr/api

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY brand ./brand

RUN npm run build --workspace=@atr/shared
RUN npm run build --workspace=@atr/api

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

RUN mkdir -p /app/data

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "dist/server.js"]
