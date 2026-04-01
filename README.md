# Thermostat Dashboard

A local web dashboard for live and historical thermostat telemetry. Reads from the MariaDB-backed sidecar REST API and presents real-time status, charts, PID gain suggestions, and a setpoint audit log.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) (for production)
- [Node.js 20+](https://nodejs.org/) (for local dev only)

## Pages

| Page | Path | Description |
|---|---|---|
| Overview | `/` | Live floor status cards with a 2-hour sparkline. Refreshes every 60 s. |
| History | `/history` | Telemetry charts: temp vs setpoint, humidity, lead minutes, precon activity. |
| Rates | `/rates` | Learned rate history, PID gain suggestions, and precon accuracy scatter plot. |
| Setpoints | `/setpoints` | Paginated audit log of every setpoint change, filterable by floor and reason. |

## Port mapping

| Host port | Container port | Service |
|---|---|---|
| `3090` | `3000` | thermostat-dashboard |

## Local development

```bash
# 1. Clone and enter the directory
cd thermostat-dashboard

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local and set NEXT_PUBLIC_SIDECAR_URL if needed

# 3. Install dependencies
npm install

# 4. Start dev server
npm run dev
```

Open http://localhost:3000.

## Production (Docker)

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f thermostat-dashboard
```

Dashboard is served at `http://<nas-ip>:3090`.

## Updating

```bash
docker-compose down
docker-compose up -d --build
```

## Configuration

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_SIDECAR_URL` | `http://10.0.0.240:3077` | Sidecar API base URL |

Set in `docker-compose.yml` (for production) or `.env.local` (for dev). No rebuild required when changing the URL in `docker-compose.yml` — it is injected at runtime.

## CORS note

The dashboard fetches the sidecar directly from the browser. If you see CORS errors, enable the server-side proxy by routing requests through `/api/proxy/[...path]`.
