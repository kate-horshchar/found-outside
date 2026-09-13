# Found Outside

A parody store and future TeamCity MCP investigation demo. The application has a
12-specimen catalogue, product pages, a cart with server-calculated quotes and
simulated adoption checkout. Nothing is sold and no payment is collected.
React/Vite and Spring Boot share one repository and one production Java JAR.
Docker, TeamCity, failure scenarios and the full baseline test suite are deferred.

## Requirements

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

## Production build and API test

From the repository root, build the frontend **before** packaging the backend:

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
cd backend
.\mvnw.cmd -B -ntp clean verify
cd ..
$env:TAX_RATE_PERCENT = '20'
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
Spring Boot does not read `.env` automatically. Set `$env:TAX_RATE_PERCENT = '20'`
in the terminal that starts Java (Unix: `export TAX_RATE_PERCENT=20`). No tax default
is supplied by the app or test harness. Without a valid integer from 0 through 100,
the app starts and the catalogue works, but quotes and checkout return the exact
`CONFIG_MISSING` error defined in the spec. The app logs the same warning once.

State is in memory. Stop and restart Java to restore all seed stock, discard
orders and restart order numbering at 1001. The browser cart survives independently
in localStorage (`found-outside-cart`); checkout clears it. A stored cart containing
invalid data receives the API error and offers **Clear cart**.

Reference adoption: Boulderina x1 + Gerald x1 at tax 20% = subtotal $144.00,
heavy lifting fee $5.00, tax $29.80, total $178.80.

Product copy is sourced from `docs/PRODUCT_CONTENT.md` and stored with the seed in
`backend/src/main/resources/data/products.json`. All product data, ordering and
quote totals are supplied by the backend; React does not duplicate the catalogue.

Replace the labelled illustration placeholders with final photos at:

- `backend/src/main/resources/images/<SKU>.webp` (1200 x 1500, at most 200 KB each).
- `frontend/public/banner.webp` (2400 x 1000, at most 400 KB).

Keep filenames unchanged, rebuild frontend/backend, and restart Java. No source
code change is required. Local fonts and their OFL licenses are bundled in the
frontend; runtime does not fetch fonts, images or APIs from external services.

Docker commands are deferred until the root Dockerfile and Compose service exist.
The planned command is `docker compose up --build` after copying `.env.example`
to `.env`. Docker is not implemented in Phase 2.

See [MVP spec](docs/MVP_SPEC.md), [technical design](docs/TECHNICAL_DESIGN.md), and
[project state and verification](docs/PROJECT_STATE.md).
