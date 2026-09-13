# Found Outside

A parody store and future TeamCity MCP investigation demo. Phase 1 is a runnable
React + Spring Boot scaffold: a connection-status page and `GET /api/health` only.
The store, Docker setup, TeamCity and failure scenarios are not implemented yet.

## Requirements

- JDK 17 (verified with Microsoft OpenJDK 17.0.18); `JAVA_HOME` points to the JDK.
- Node.js 24.14.0 and npm 11.9.0 (pinned in `.node-version` and `frontend/package.json`).
- Maven is downloaded by the committed Maven Wrapper; no global Maven install needed.
- Internet access to npm and Maven Central for the initial build.

## Local development (PowerShell)

Terminal 1, from the repository root:

```powershell
cd backend
.\mvnw.cmd -B -ntp spring-boot:run
```

Terminal 2, from the repository root:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open <http://localhost:5173>. The page must show `Backend connected — status: ok`.
The Vite proxy forwards `/api` to <http://127.0.0.1:8080>.
Use Ctrl+C in each terminal to stop. `npm.cmd` avoids PowerShell's script policy
restriction on `npm.ps1`; changing execution policy is unnecessary.

## Production build and API test

From the repository root, build the frontend **before** packaging the backend:

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
cd backend
.\mvnw.cmd -B -ntp clean verify
cd ..
java -jar backend/target/found-outside.jar
```

Open <http://localhost:8080> and <http://localhost:8080/api/health>.
The JAR includes the built frontend and needs only Java at runtime.
Stop it with Ctrl+C. To run only the API test:

```powershell
cd backend
.\mvnw.cmd -B -ntp test
```

On macOS/Linux, use `npm` and `sh ./mvnw` in place of `npm.cmd` and `.\mvnw.cmd`.
Java and Node versions are unchanged.

## Configuration and next phases

`.env.example` contains the safe future Compose input `TAX_RATE_PERCENT=20`.
Spring Boot does not read `.env` automatically. Future local pricing tests will
inherit `$env:TAX_RATE_PERCENT = '20'`; no tax default will be supplied by the app
or test harness. Phase 1 health works without this setting.

Docker commands are deferred until the root Dockerfile and Compose service exist.
The planned command is `docker compose up --build` after copying `.env.example`
to `.env`. Do not treat this as available in Phase 1.

See [MVP spec](docs/MVP_SPEC.md), [technical design](docs/TECHNICAL_DESIGN.md), and
[project state and verification](docs/PROJECT_STATE.md).
