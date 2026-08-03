# Dockerfile générique pour lancer des tests JS (Jest) sur n'importe quel projet
# Usage : voir docker-compose.yml ou les commandes docker run ci-dessous

FROM node:20-alpine3.22
RUN apk update && apk upgrade --no-cache

WORKDIR /app

ENV NODE_PATH=/usr/local/lib/node_modules

# On ne copie rien en dur : le code est monté en volume au lancement (voir README)
# Cela permet de réutiliser cette image sur n'importe quel projet sans rebuild.

# Installation globale de jest + jsdom pour éviter d'avoir un package.json obligatoire
# RUN npm install -g jest jest-environment-jsdom
RUN npm install -g jest jest-environment-jsdom babel-jest @babel/core @babel/preset-env

ENTRYPOINT ["jest"]
CMD ["--config", "/app/jest.config.js"]
