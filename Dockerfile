# Build the static app; this stage is not included in the final image.
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
RUN npm run build

# Scratch contains only the Static Web Server binary and its required runtime files.
FROM joseluisq/static-web-server:2.44 AS runtime
COPY --from=build /app/dist /public
ENV SERVER_ROOT=/public
EXPOSE 80
LABEL org.opencontainers.image.source="https://github.com/CicerBro/texttools" \
      org.opencontainers.image.description="Texttools static web app served by Static Web Server"
