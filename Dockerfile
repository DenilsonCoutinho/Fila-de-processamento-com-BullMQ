# syntax = docker/dockerfile:1

# Ajuste da versão do Node.js
ARG NODE_VERSION=20.17.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js/Prisma"

WORKDIR /app
ENV NODE_ENV="production"

# Stage para build (instala dependências e gera Prisma Client)
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp openssl pkg-config python-is-python3

COPY package-lock.json package.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Stage final para imagem de produção
FROM base

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

COPY --from=build /app /app

# Instala ts-node e typescript globalmente para rodar o worker em TS
RUN npm install -g ts-node typescript

# NÃO expõe porta pois não é app HTTP
# Comando padrão para rodar seu worker
CMD ["ts-node", "src/worker.ts"]
