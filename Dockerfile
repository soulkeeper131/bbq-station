# BBQ Station — Docker image
FROM node:22-alpine
WORKDIR /app

# Копираме само нужното
COPY package.json ./
COPY local-server.mjs ./
COPY menu-prototip_8.html ./
COPY public/ ./public/
COPY data/ ./data/

# Създаваме директории за runtime данни
RUN mkdir -p /app/data/uploads /app/data/backups

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "local-server.mjs"]
