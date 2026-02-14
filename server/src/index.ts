import express from "express";
import cors from "cors";
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

// === Paths (ESM-safe) ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dist путь: server/dist/index.js -> ../../client/dist
const clientDistPath = path.resolve(__dirname, "../../client/dist");

// === CORS ===
// Если фронт и бэк на ОДНОМ домене (Render all-in-one) — CORS можно вообще не включать.
// Но оставим безопасный вариант.
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL, // например https://mood-metrics-h4b3.vercel.app
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman/curl/healthchecks
    if (process.env.NODE_ENV !== "production") return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: false, // если ты используешь Bearer token (Authorization)
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// === health ===
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/health", (req, res) => res.json({ ok: true }));

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

// =======================================================
// ✅ FRONTEND (client/dist) — ВОТ ТА САМАЯ ЧАСТЬ "для dist"
// =======================================================

// 1) статика (js/css/assets)
app.use(express.static(clientDistPath));

// 2) SPA fallback: любые не-API запросы -> index.html
app.get("*", (req, res, next) => {
  // если это API — пусть упадёт на 404 ниже, или обработается роутами выше
  if (req.path.startsWith("/api")) return next();

  return res.sendFile(path.join(clientDistPath, "index.html"));
});

// 3) fallback 404 (только для API)
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

// старт
(async () => {
  await initializeData(); // один раз
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("Allowed origins:", allowedOrigins);
    console.log("Client dist path:", clientDistPath);
  });
})();
