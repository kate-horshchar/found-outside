# Found Outside

A parody online store ("Premium goods. Found outside.") used as a deterministic CI test
target for TeamCity failure-investigation demos. A React + Vite frontend and a Spring Boot
API ship as one Java application. The store is not real: no products are actually sold
and no payments are taken. CI runs in TeamCity on `main`; see
[teamcity/README.md](teamcity/README.md) for the local TeamCity setup.

## Run with Docker

Requires Docker Desktop (or Docker Engine) with Compose v2.

```powershell
Copy-Item .env.example .env        # macOS/Linux: cp .env.example .env
docker compose up --build -d
docker compose ps                  # wait for "(healthy)"
```

The image build also runs the backend API tests; a failing test fails the build.

- Store: <http://localhost:8080/>
- Health: <http://localhost:8080/api/health>

Compose service `app`, container `found-outside-app`, port `8080`.

```powershell
docker compose logs -f app                  # follow logs
docker compose restart app                  # reset stock and orders (next order #1001)
docker compose up -d --force-recreate app   # apply .env changes
docker compose build --no-cache --pull      # clean rebuild
docker compose down                         # stop and remove the container
docker compose down --rmi all               # also remove the app image
```

## Build and test without Docker

Requires JDK 17, Node.js 24.14.0 and npm 11.9.0. Maven comes from the wrapper.
Build the frontend first: the backend JAR bundles `frontend/dist`.

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
cd backend
$env:TAX_RATE_PERCENT = '20'
.\mvnw.cmd -B -ntp clean verify
java -jar target/found-outside.jar
```

On macOS/Linux use `npm`, `export TAX_RATE_PERCENT=20` and `sh ./mvnw`.
Test reports: `backend/target/surefire-reports/`.

For frontend development, run the backend with `.\mvnw.cmd spring-boot:run` (tax set as
above) and `npm.cmd --prefix frontend run dev`, then open <http://localhost:5173>.

## Configuration

`TAX_RATE_PERCENT` (integer 0–100) is required for quotes and checkout. Docker reads it
from `.env`; local runs need it in the shell. There is no default: if it is missing or
invalid, the store still runs but cart and checkout return
`Required setting TAX_RATE_PERCENT is missing or invalid`.

State is kept in memory, so restarting the app restores seed stock. The browser cart is
stored in localStorage.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Cannot connect to the Docker API | Start Docker Desktop. |
| Port 8080 is already allocated | Stop the other process on 8080, e.g. a local `java -jar` (`Get-NetTCPConnection -LocalPort 8080 -State Listen`). |
| Cart shows the `TAX_RATE_PERCENT` error | Check `.env` with `docker compose config`; a shell variable overrides it. Then `docker compose up -d --force-recreate app`. |
| Image build fails | Run `docker compose build --progress=plain` and read the first error. |
| Container is `(unhealthy)` | `docker compose logs app`. |
