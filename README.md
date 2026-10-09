# UserCue App

React + TypeScript + Vite + Bun HTTP server with auto-loaded routes and Docker support.

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed
- Docker (optional)

### Development (Local)

Start both API and Frontend in parallel (concurrently):
```bash
bun run dev
```

Or start individually:
```bash
# API server only (port 3000)
bun run dev:server

# Vite dev server only (port 5173)
bun run dev:vite
```

The Vite dev server proxies `/api/*` to `http://localhost:3000`.

### Build
```bash
bun run build
```

### Production
```bash
NODE_ENV=production bun server.ts
```

### Type-check
```bash
bun run typecheck
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/hello` - Example endpoint  
- `GET /api/echo/:name` - Dynamic route example

## Adding Routes

Add files in `src/server/routes/`. Export uppercase HTTP method handlers.

```ts
// src/server/routes/api/example.ts
export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(req: Request) {
  const body = await req.json();
  return Response.json({ received: body }, { status: 201 });
}
```

Dynamic params use `[param].ts`:
```ts
// src/server/routes/api/users/[id].ts
export async function GET(_req: Request, params?: Record<string, string>) {
  return Response.json({ id: params?.id });
}
```

## Docker

### Production
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Or use the main compose:
```bash
docker compose up app --build -d
```

App runs at http://localhost:3000

### Development
```bash
docker compose -f docker-compose.dev.yml up --build
# or
docker compose up dev --build
```

Ports: `3000` (API) + `5173` (Vite HMR)

## Architecture

- `server.ts` - entrypoint (runs Bun.serve)
- `src/server/index.ts` - server logic, serves built Vite app in production
- `src/server/router.ts` - auto-discovers routes using `Bun.Glob`
- `src/server/routes/**` - filesystem-based routes
- `vite.config.ts` - dev proxy to API
- Built frontend in `dist/` served statically in production
