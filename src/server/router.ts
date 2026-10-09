import { Glob } from "bun";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { methods } from "../assets/colors/methods"
import chalk from "chalk";

type Handler = (req: Request, params?: Record<string, string>) => Promise<Response> | Response;

const __dirname = dirname(fileURLToPath(import.meta.url));

const routes: Array<{
  method: string;
  pattern: URLPattern;
  handler: Handler;
}> = [];

const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

// Scan the routes/ folder and register every exported HTTP method.
// File path becomes the route:
//   routes/api/health.ts -> /api/health
//   routes/index.ts      -> /
//   routes/users/[id].ts -> /users/:id
const glob = new Glob("./routes/**/*.ts");

for await (const file of glob.scan({ cwd: __dirname })) {
  const mod = (await import(join(__dirname, file))) as Record<string, Handler>;

  let routePath = file
    .replace(/^\.?\/?routes/, "")
    .replace(/\.(ts|js)$/, "")
    .replace(/\/index$/, "");

  if (routePath === "") routePath = "/";

  // [param] -> :param
  routePath = routePath.replace(/\[(\w+)\]/g, ":$1");

  for (const method of METHODS) {
    const handler = mod[method];
    if (typeof handler === "function") {
      routes.push({
        method,
        pattern: new URLPattern({ pathname: `/api${routePath}` }),
        handler,
      });

      console.log(`${chalk[methods[method]](`${method}`)} /api${routePath}`)
    }
  }
}

console.log(chalk.dim(`------------------------------------`))

export function matchRoute(req: Request) {
  const url = new URL(req.url);
  for (const r of routes) {
    if (r.method !== req.method) continue;
    const m = r.pattern.exec(url);
    if (m) return { handler: r.handler, params: m.pathname.groups };
  }
  return null;
}
