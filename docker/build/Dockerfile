# Dockerfile générique pour builder n'importe quel projet statique avec Vite
FROM node:20-alpine3.22
RUN apk update && apk upgrade --no-cache

WORKDIR /app

ENV NODE_PATH=/usr/local/lib/node_modules

RUN npm install -g vite vite-plugin-html-minifier

ENTRYPOINT ["vite"]
CMD ["build", "--outDir", "/app/dist"]
