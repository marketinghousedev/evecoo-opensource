FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DB_PATH=/data/evecoo.db
COPY --from=build /app ./
RUN npm prune --omit=dev && mkdir -p /data
VOLUME /data
EXPOSE 3000
HEALTHCHECK CMD node -e "fetch('http://localhost:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm","start"]
