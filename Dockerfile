# SunucumWEB CMS - Strapi 5 container for Bunny Magic Containers
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV CI=true
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3654
COPY --from=builder /app /app
RUN mkdir -p /app/.cache /app/.tmp /app/public/uploads && chown -R node:node /app
USER node
EXPOSE 3654
CMD ["npm", "run", "start"]
