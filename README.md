# Found Outside

A parody store and future TeamCity MCP investigation demo. The application has a
13-specimen catalogue, product pages, a cart with server-calculated quotes and
simulated adoption checkout. Nothing is sold and no payment is collected.
React/Vite and Spring Boot share one repository and one production Java JAR.
The app runs locally or in Docker; TeamCity, failure scenarios and the full
baseline test suite are deferred.

## Run with Docker

Requires Docker Desktop (Windows: WSL2 engine) with Docker Compose v2. Verified with
Docker Engine 29.4.0 and Compose v5.1.1. Internet access to Docker Hub, npm and Maven
Central is needed while building.

From the repository root:

```powershell
Copy-Item .env.example .env        # macOS/Linux: cp .env.example .env
docker compose build --no-cache --pull
docker compose up -d
docker compose ps                  # wait for STATUS "Up ... (healthy)"
```

`docker compose up --build -d` is the everyday one-step form. The image build runs the
frontend production build, then the backend Maven Wrapper `clean verify` including the
API tests (with a non-secret `TAX_RATE_PERCENT=20` scoped to that build command). A
failing test fails the image build.

| URL | Purpose |
|---|---|
| <http://localhost:8080/> | Store (catalogue) |
| <http://localhost:8080/products/ROCK-GERALD> | Product page (SPA deep link) |
| <http://localhost:8080/cart> | Cart and checkout |
| <http://localhost:8080/api/health> | Health: `{"status":"ok"}` |
| <http://localhost:8080/api/products> | Catalogue API |

One origin serves everything: Spring Boot serves the React bundle and `/api` from a
single Java process. There is no separate frontend server, database or volume.

| Item | Name |
|---|---|
| Compose project | `found-outside` |
| Service | `app` |
| Container | `found-outside-app` |
| Image | `found-outside-app:0.1.0` |
| Network | `found-outside_default` (the app is reachable as `app` inside it) |
| Port | host `8080` → container `8080` |

Everyday commands:

```powershell
docker compose logs -f app                  # follow logs (Ctrl+C stops following only)
docker compose restart app                  # reset in-memory stock and orders (next order #1001)
docker compose up -d --force-recreate app   # apply .env changes (restart does not reload .env)
docker compose down                         # stop and remove the container and network
docker compose down --rmi all               # also remove the found-outside-app:0.1.0 image
```

All application state is in memory, so `docker compose down` already discards it;
there are no volumes. `--rmi all` removes only this project's service image, not the
pulled `node`/`eclipse-temurin` base images or other projects' resources. The browser
cart lives in the browser's localStorage (`found-outside-cart`), not in Docker: clear it
with checkout, the **Clear cart** button, or the browser's site-data settings.

In Docker Desktop: **Containers** → `found-outside` → `found-outside-app` shows the
health status, the **Logs** tab, and Stop / Restart / Delete buttons. Restarting there
equals `docker compose restart app`; it does not reload `.env`.

To export the Surefire XML produced by the Docker test run:

```powershell
docker build --target test-reports --output type=local,dest=.verification/docker-surefire .
```

### Startup diagnosis

| Symptom | Check / fix |
|---|---|
| `failed to connect to the docker API ... dockerDesktopLinuxEngine` | Docker Desktop is not running. Start it and wait until the engine is ready. |
| `Bind for 0.0.0.0:8080 failed: port is already allocated` or `address already in use` | Something else uses 8080 (often a local `java -jar` or `spring-boot:run`). PowerShell: `Get-NetTCPConnection -LocalPort 8080 -State Listen`; macOS/Linux: `lsof -i :8080`. Stop that process, then `docker compose up -d`. |
| Container name `found-outside-app` already in use | A stale container from this project: `docker compose down`, then start again. |
| Build fails at `npm ci` or `mvnw` | Network/registry access during build, or a real compile/test failure. Rerun with `docker compose build --progress=plain` and read the first error. |
| `docker compose ps` shows `(unhealthy)` or stays `(health: starting)` | `docker compose logs app` and `docker inspect --format '{{json .State.Health}}' found-outside-app`. |
| Store and health work, but cart/checkout show `Required setting TAX_RATE_PERCENT is missing or invalid` | `.env` is missing or `TAX_RATE_PERCENT` is not an integer 0–100. `docker compose config` shows the value passed. A `TAX_RATE_PERCENT` set in your shell overrides `.env`. Fix it, then `docker compose up -d --force-recreate app`. |

Health only proves the process is serving HTTP; it does not prove the tax setting.
Check the cart or `POST /api/quote` for that.

## Requirements for local (non-Docker) development

- JDK 17 (verified with Microsoft OpenJDK 17.0.18); `JAVA_HOME` points to the JDK.
- Node.js 24.14.0 and npm 11.9.0 (pinned in `.node-version` and `frontend/package.json`).
- Maven is downloaded by the committed Maven Wrapper; no global Maven install needed.
- Internet access to npm and Maven Central for the initial build.

## Local development (PowerShell)

Terminal 1, from the repository root:

```powershell
cd backend
$env:TAX_RATE_PERCENT = '20'
.\mvnw.cmd -B -ntp spring-boot:run
```

Terminal 2, from the repository root:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Open <http://localhost:5173> to browse the collection.
The Vite proxy forwards `/api` to <http://127.0.0.1:8080>.
Use Ctrl+C in each terminal to stop. `npm.cmd` avoids PowerShell's script policy
restriction on `npm.ps1`; changing execution policy is unnecessary.
Stop the Docker app first (`docker compose down`): both use port 8080.

## Production build and API test

From the repository root, build the frontend **before** packaging the backend:

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
cd backend
$env:TAX_RATE_PERCENT = '20'
.\mvnw.cmd -B -ntp clean verify
cd ..
java -jar backend/target/found-outside.jar
```

Open <http://localhost:8080> and <http://localhost:8080/api/health>.
The JAR includes the built frontend and needs only Java at runtime.
Stop it with Ctrl+C. To run only the API tests:

```powershell
cd backend
$env:TAX_RATE_PERCENT = '20'
.\mvnw.cmd -B -ntp test
```

On macOS/Linux, use `npm` and `sh ./mvnw` in place of `npm.cmd` and `.\mvnw.cmd`,
and `export TAX_RATE_PERCENT=20`. Java and Node versions are unchanged.
Surefire XML reports are written to `backend/target/surefire-reports/`.

## Configuration

`.env.example` contains the safe Compose input `TAX_RATE_PERCENT=20`; copy it to the
git-ignored `.env`. Docker Compose passes that single variable to the container with
no default. Spring Boot does not read `.env` when run outside Docker: set
`$env:TAX_RATE_PERCENT = '20'` in the terminal that starts Java or Maven. No tax default
is supplied by the app or test harness. Without a valid integer from 0 through 100,
the app starts and the catalogue works, but quotes and checkout return the exact
`CONFIG_MISSING` error defined in the spec. The app logs the same warning once.

State is in memory. Restart the app (Java or `docker compose restart app`) to restore
all seed stock, discard orders and restart order numbering at 1001. The browser cart
survives independently in localStorage (`found-outside-cart`); checkout clears it. A
stored cart containing invalid data receives the API error and offers **Clear cart**.

Reference adoption: Boulderina x1 + Gerald x1 at tax 20% = subtotal $144.00,
heavy lifting fee $5.00, tax $29.80, total $178.80.

Product data, ordering and quote totals are supplied by the backend from
`backend/src/main/resources/data/products.json`; React does not duplicate the catalogue.

Product photos and the banner are replaceable without code changes:

- `backend/src/main/resources/images/<SKU>.webp` (1200 x 1500, at most 200 KB each).
- `frontend/public/banner.webp` (2400 x 1000, at most 400 KB).

Keep filenames unchanged, rebuild (or `docker compose up --build -d`) and restart.
Local fonts and their OFL licenses are bundled in the frontend; runtime does not fetch
fonts, images or APIs from external services.
