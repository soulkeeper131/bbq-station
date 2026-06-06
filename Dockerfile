# BBQ Station — лек контейнер за Coolify.
# Приложението е без външни зависимости (ползва вградения fetch/http на Node),
# затова не е нужен npm install.
FROM node:22-alpine

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# Копираме само нужните файлове за изпълнение.
COPY package.json ./
COPY local-server.mjs ./
COPY test-viber.mjs ./
COPY menu-prototip_8.html ./

EXPOSE 3000

# Health check (Coolify може да го ползва за readiness).
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "local-server.mjs"]
