############################################
# Stage 1: Build
############################################
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# VITE_API_URL is injected at BUILD time via Render/Vercel env vars
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

############################################
# Stage 2: Serve with nginx
############################################
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# React Router requires all routes to fall back to index.html
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { try_files $uri $uri/ /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
