# ---------- Etapa 1: build de Angular ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Etapa 2: servir con nginx ----------
FROM nginx:1.27-alpine

# URL del backend al que nginx reenvía /api (se puede sobreescribir en runtime).
ENV BACKEND_URL=http://host.docker.internal:8000
# Puerto de escucha. Cloud Run lo define con la variable PORT (8080 por defecto).
ENV PORT=8080

# La imagen oficial procesa /etc/nginx/templates/*.template con envsubst al arrancar.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/issue-tracker/browser /usr/share/nginx/html

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" >/dev/null || exit 1
