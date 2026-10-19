FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates zip \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /source
COPY package.json package-lock.json tsconfig.json ./
COPY apps ./apps
COPY packages ./packages
COPY scripts/package-web.mjs scripts/stage-deployment.ts ./scripts/
ARG SOURCE_COMMIT
ENV SOURCE_COMMIT=${SOURCE_COMMIT}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm ci && npm run build \
    && node --experimental-strip-types scripts/stage-deployment.ts web /artifacts
RUN npm ci --omit=dev --ignore-scripts --workspace @cloudyo/worker --include-workspace-root=false \
    && node --experimental-strip-types scripts/stage-deployment.ts worker /artifacts

FROM scratch AS artifacts
COPY --from=build /artifacts/web.zip /artifacts/worker.zip /artifacts/manifest.json /
