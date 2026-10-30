FROM node:20-alpine
WORKDIR /app
COPY platform/package.json ./
COPY platform/server.js platform/meta-posting.js platform/config.json ./
RUN mkdir -p data
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
