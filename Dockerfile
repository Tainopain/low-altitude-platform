# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=
ENV VITE_WS_URL=
RUN npm run build

# Stage 2: Build server
FROM node:22-alpine AS server-build

WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Nginx + Server
FROM node:22-alpine

# Server
WORKDIR /app/server
COPY --from=server-build /app/node_modules ./node_modules
COPY --from=server-build /app/dist ./dist
COPY --from=server-build /app/package.json ./
RUN mkdir -p /app/server/data

# Frontend + Nginx
RUN apk add --no-cache nginx
COPY --from=frontend-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/http.d/default.conf

EXPOSE 80 3001

CMD nginx && node /app/server/dist/index.js
