# ── Stage 1: Build the React app ─────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json .
RUN npm install

COPY public/ ./public/
COPY src/    ./src/

ARG REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
