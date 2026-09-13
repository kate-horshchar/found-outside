# Official TeamCity agent plus the Found Outside build toolchain:
# Java 17 (same Temurin build as the app image) and Node.js 24.14.0 / npm 11.9.0.
FROM eclipse-temurin:17.0.18_8-jdk-noble AS jdk17
FROM node:24.14.0-bookworm-slim AS node

FROM jetbrains/teamcity-agent:2026.1.4-linux

USER root
COPY --from=jdk17 /opt/java/openjdk /opt/java/jdk17
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && mkdir -p /home/buildagent/.m2 /home/buildagent/.npm \
    && chown buildagent:buildagent /home/buildagent/.m2 /home/buildagent/.npm \
    && /opt/java/jdk17/bin/java -version \
    && node --version \
    && npm --version

# The agent launcher keeps the image's Java 21 (TEAMCITY_JRE); build steps inherit Java 17.
ENV TEAMCITY_JRE=/opt/java/openjdk \
    FORCE_USE_TEAMCITY_JRE=1 \
    JAVA_HOME=/opt/java/jdk17 \
    JDK_HOME=/opt/java/jdk17 \
    JDK_17_0=/opt/java/jdk17 \
    JDK_21_0=/opt/java/openjdk \
    PATH=/opt/java/jdk17/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

USER buildagent
