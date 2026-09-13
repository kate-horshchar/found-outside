# Found Outside: one image, one Java process serving the React bundle and /api.

# 1. Frontend production build (Node 24.14.0 bundles npm 11.9.0; engine-strict enforces both).
FROM node:24.14.0-bookworm-slim AS frontend-build
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# 2. Backend build and baseline API tests with the committed Maven Wrapper.
FROM eclipse-temurin:17.0.18_8-jdk-noble AS backend-build
# The only-script wrapper needs unzip to verify and unpack the checksummed .zip distribution.
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace/backend
COPY backend/ ./
# backend/pom.xml packages the sibling ../frontend/dist as classpath static/.
COPY --from=frontend-build /workspace/frontend/dist /workspace/frontend/dist
# Non-secret test setting scoped to this command only; it is not part of any image environment.
RUN TAX_RATE_PERCENT=20 sh ./mvnw -B -ntp clean verify

# Optional export of the Surefire XML from the build above:
#   docker build --target test-reports --output type=local,dest=<dir> .
FROM scratch AS test-reports
COPY --from=backend-build /workspace/backend/target/surefire-reports/ /

# 3. Runtime: Java 17 JRE, the packaged JAR and curl for the Compose healthcheck.
FROM eclipse-temurin:17.0.18_8-jre-noble AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl --version \
    && useradd --system --no-create-home --shell /usr/sbin/nologin foundoutside
WORKDIR /app
COPY --from=backend-build /workspace/backend/target/found-outside.jar /app/found-outside.jar
USER foundoutside
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/found-outside.jar"]
