import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { matchRoute } from "./router";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";
const distPath = join(__dirname, "../../dist");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const server = Bun.serve({
  port: PORT,
  hostname: HOST,
  fetch: async (req: Request) => {
    const matched = matchRoute(req);
    if (matched) {
      try {
        return await matched.handler(req, matched.params as Record<string, string>);
      } catch (e) {
        console.error("Route handler error:", e);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
      }
    }

    // serve frontend in prod
    if (isProduction) {
      if (!existsSync(distPath)) {
        return Response.json({ error: "Frontend not built. Run bun run build first." }, { status: 500 });
      }

      const url = new URL(req.url);
      const filePath = url.pathname === "/" ? join(distPath, "index.html") : join(distPath, url.pathname);
      const file = Bun.file(filePath);

      if (await file.exists()) return new Response(file);

      const indexFile = Bun.file(join(distPath, "index.html"));
      if (await indexFile.exists()) return new Response(indexFile);

      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ error: "This is the API server. Frontend is served by Vite dev server." }, { status: 404 });
  },
});

console.log(`Bun HTTP server listening on http://localhost:${PORT}`);
export default server;
