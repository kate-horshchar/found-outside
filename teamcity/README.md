# TeamCity for Found Outside

A local TeamCity Server and one build agent that run the Found Outside API tests.
This stack is separate from the app stack in the repository root, so always pass
`-f teamcity/docker-compose.yml`.

- TeamCity 2026.1.4 with the internal database.
- Server image: `jetbrains/teamcity-server:2026.1.4-linux`.
- Agent image: built by `teamcity/agent/Dockerfile` from `jetbrains/teamcity-agent:2026.1.4-linux`.
  It adds Java 17 (`JAVA_HOME`) and Node.js 24.14.0 / npm 11.9.0 for builds; the agent
  itself runs on the image's Java 21.
- No Docker socket is mounted; builds do not use Docker.

## Start

```powershell
docker compose -f teamcity/docker-compose.yml up -d --build
docker compose -f teamcity/docker-compose.yml ps
```

- TeamCity UI: <http://localhost:8111>
- The agent connects to the server at `http://teamcity-server:8111` inside the Compose network.

| Service | Container |
|---|---|
| `teamcity-server` | `found-outside-teamcity-server` |
| `teamcity-agent` | `found-outside-teamcity-agent` (agent name `Geralt`) |

## First run (once)

1. Open <http://localhost:8111>. On "Confirming TeamCity first start" click
   **I'm a server administrator, show me the details**.
2. Data Directory `/data/teamcity_server/datadir`: click **Proceed** (not "Restore from backup").
3. Database connection setup: keep **Internal (HSQLDB)**, click **Proceed**, and wait for
   initialization (1–3 minutes).
4. License Agreement: accept it (usage statistics are optional) and click **Continue**.
5. Create the administrator account. Keep the password outside the repository. Do not use
   **Login as Super user**; it is a maintenance login.
6. Keep the default server URL `http://localhost:8111`.

## Authorize the agent

**Agents** → **Unauthorized** → `Geralt` → **Authorize**.
The authorization is stored in `teamcity/agent/conf/`, so recreating the agent container
does not require authorizing it again.

## Check health

```powershell
docker compose -f teamcity/docker-compose.yml ps               # server "(healthy)"
curl.exe -fsS http://localhost:8111/healthCheck/healthy
docker compose -f teamcity/docker-compose.yml logs --tail 50 teamcity-agent
```

In the UI, **Agents** → **Connected** must show exactly one authorized agent, `Geralt`.

## Build configuration (UI setup, once)

Settings are entered in the TeamCity UI and are not stored in the repository, so a
parameter change produces no VCS change.

**Project** — Administration → Projects → **Create project** → **Manually**:
name `Found Outside`, project ID `FoundOutside`.

**VCS root** — project → **VCS Roots** → **Create VCS root**:

| Field | Value |
|---|---|
| Type | Git |
| VCS root name / ID | `found-outside main` / `FoundOutside_GitHubMain` |
| Fetch URL | the repository's public HTTPS clone URL |
| Default branch | `refs/heads/main` |
| Branch specification | `+:refs/heads/main` |
| Authentication method | Anonymous |
| Changes checking interval | Custom, 60 seconds |

**Build configuration** — project → **Create build configuration** → **Manually**:
name `API Tests`, build configuration ID `FoundOutside_ApiTests`, build number format
`%build.counter%`, no artifact paths. Attach the VCS root above.

**Build steps** (runner type Command Line, custom script; each step runs only if all
previous steps succeeded):

| # | Step name | Working directory | Script |
|---|---|---|---|
| 1 | Install dependencies | `frontend` | `npm ci --no-audit --no-fund` |
| 2 | Build frontend | `frontend` | `npm run build` |
| 3 | Build backend | `backend` | `sh ./mvnw -B -ntp clean package -DskipTests` |
| 4 | Run API tests | `backend` | `sh ./mvnw -B -ntp surefire:test` |

Step 3 cleans old outputs and reports, compiles main and test code and packages the JAR
without running tests. Step 4 runs the full suite once. A compilation failure stops the
build at step 3 with zero test results. Maven dependencies are resolved by the committed
Maven Wrapper; npm dependencies come from `package-lock.json`.

**Build feature** — **XML report processing**: report type Ant JUnit, monitoring rule
`+:backend/target/surefire-reports/TEST-*.xml` (one feature only, so tests are imported once).

**Parameters** — `env.TAX_RATE_PERCENT` = `20` (environment variable, not secret).

**Failure conditions** — keep the defaults (failed tests, non-zero exit code, error message
from a runner, out of memory/crash) and add execution timeout 10 minutes.

**Triggers** — **VCS Trigger**, branch filter `+:<default>`.

Builds run on the single authorized agent. No personal builds, no artifacts, no Docker.

## Persistence

| Location | Contents |
|---|---|
| `teamcity/data/` | Settings, internal database, build history |
| `teamcity/logs/` | Server logs |
| `teamcity/agent/conf/` | Agent configuration and authorization |
| `teamcity/agent/logs/` | Agent logs |
| Docker volumes `found-outside-teamcity_agent-*` | Agent checkouts, system data, temp, plugins, tools, Maven and npm caches |
| Docker volume `found-outside-teamcity_server-temp` | Server temporary files |

These folders are git-ignored. `stop`/`start`, `restart` and `down` followed by `up`
keep all of the above.

## Stop

```powershell
docker compose -f teamcity/docker-compose.yml stop    # stop, keep containers
docker compose -f teamcity/docker-compose.yml down    # remove containers and network, keep data
```

## Full reset

Deletes all TeamCity settings, build history and agent authorization for this project only:

```powershell
docker compose -f teamcity/docker-compose.yml down -v
Remove-Item -Recurse -Force teamcity/data, teamcity/logs, teamcity/agent/conf, teamcity/agent/logs
```

`down -v` removes only this stack's containers, network and volumes. Do not use
`docker system prune` or `docker volume prune`: they affect other projects.
