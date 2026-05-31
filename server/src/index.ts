import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import surveysRouter from "./routes/surveys.js";
import employeesRoutes from "./routes/employees.js";
import dashboardRoutes from "./routes/dashboard.js";
import zonesRoutes from "./routes/zones.js";
import notificationsRoutes from "./routes/notifications.js";
import settingsRoutes from "./routes/settings.js";
import responsesRoutes from "./routes/responses.js";
import adminUsersRoutes from "./routes/adminUsers.js";
import aiRoutes from "./routes/ai.js";

import { initializeData } from "./data/initialize.js";

const app = express();
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT || 5000);
const NODE_ENV = process.env.NODE_ENV || "development";

// === Paths (ESM-safe) ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "../../client/dist");

// === Security headers (helmet) ===
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // нужно для Vite dev
    contentSecurityPolicy:
      NODE_ENV === "production"
        ? undefined // включить в проде с дефолтными настройками
        : false,    // выключить в dev (не мешает HMR)
  })
);

// === CORS ===
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (NODE_ENV !== "production") return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// === Body & Cookies ===
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// === Health checks ===
app.get("/health", (_req, res) => res.json({ status: "ok", env: NODE_ENV }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// === API routes ===
app.use("/api/auth", authRoutes);
app.use("/api/surveys", surveysRouter);
app.use("/api/employees", employeesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/zones", zonesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/responses", responsesRoutes);
app.use("/api/admin/users", adminUsersRoutes);
app.use("/api/ai", aiRoutes);

// === Frontend SPA ===
app.use(express.static(clientDistPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  return res.sendFile(path.join(clientDistPath, "index.html"));
});

// === 404 fallback (только для /api) ===
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// === Start ===
(async () => {
  await initializeData();
  app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT} [${NODE_ENV}]`);
    console.log("   Allowed origins:", allowedOrigins);
  });
})();