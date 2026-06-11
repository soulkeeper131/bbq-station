# BBQ Station — Docker image
FROM node:22-alpine

# curl за health check (Coolify HTTP health check)
RUN apk add --no-cache curl

WORKDIR /app
COPY package.json ./
COPY local-server.mjs ./
COPY public/ ./public/

RUN mkdir -p /app/data/uploads /app/data/backups

EXPOSE 3000
CMD ["node", "local-server.mjs"]
