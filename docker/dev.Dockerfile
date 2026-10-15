FROM node:22-alpine

RUN apk add --no-cache libc6-compat git bash curl python3 make g++

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

ENV NODE_ENV=development
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
