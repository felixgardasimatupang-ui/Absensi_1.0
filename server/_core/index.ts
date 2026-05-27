import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", true);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Simple in-memory rate limiter for attendance check-in/out (KRITIS-06)
  const checkLimitMap = new Map<string, { count: number; lastReset: number }>();
  setInterval(() => {
    const now = Date.now();
    checkLimitMap.forEach((value, key) => {
      if (now - value.lastReset > 5 * 60_000) {
        checkLimitMap.delete(key);
      }
    });
  }, 60_000).unref();

  app.use((req, res, next) => {
    const isSensitive = req.path.includes("attendance.checkIn") || req.path.includes("attendance.checkOut");
    if (isSensitive) {
      const forwarded = typeof req.headers["x-forwarded-for"] === "string"
        ? req.headers["x-forwarded-for"].split(",")[0]?.trim()
        : undefined;
      const clientIp = forwarded || req.ip || "unknown";
      const key = `${clientIp}:${req.path}`;
      const now = Date.now();
      const record = checkLimitMap.get(key) || { count: 0, lastReset: now };

      // 1 minute window, max 5 check-in/out requests per minute
      if (now - record.lastReset > 60000) {
        record.count = 1;
        record.lastReset = now;
        checkLimitMap.set(key, record);
      } else {
        record.count += 1;
        checkLimitMap.set(key, record);
        if (record.count > 5) {
          res.status(429).json({
            error: {
              message: "Terlalu banyak permintaan absensi. Silakan coba lagi setelah 1 menit.",
              code: -32005,
              data: { code: "TOO_MANY_REQUESTS", httpStatus: 429 }
            }
          });
          return;
        }
      }
    }
    next();
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
