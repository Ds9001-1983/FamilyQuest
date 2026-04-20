import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { log } from "./vite";

const app = express();

// Allow-list of origins permitted to call the API (Expo dev client, hosted web, etc.).
// Configure via CORS_ORIGINS env (comma-separated). Mobile apps using Bearer tokens
// typically do not send an Origin header, so those requests pass through unchanged.
const corsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // native apps, curl, server-to-server
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  const port = Number.parseInt(process.env.PORT ?? "5000", 10);
  const host = process.env.HOST ?? "0.0.0.0";
  server.listen({ port, host, reusePort: true }, () => {
    log(`serving on ${host}:${port}`);
  });
})();
