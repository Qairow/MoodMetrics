import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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
import aiRouter from "./routes/ai.js";

import { initializeData } from "./data/initialize.js";

const app = express();
app.set("trust proxy", 1);

const PORT = Number(process.env.PORT || 5000);

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL || "",
].filter(Boolean) as String[];


const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    // ✅ без origin (Postman, SSR, curl) — разрешаем
    if (!origin) return cb(null, true);

    // ✅ в DEV проще: разрешаем всё, чтобы не ловить CORS при отладке
    if (process.env.NODE_ENV !== "production") return cb(null, true);

    // ✅ в PROD — только whitelist
    if (allowedOrigins.includes(origin)) return cb(null, true);

    // ❗ НЕ кидаем ошибку, просто запрещаем
    return cb(null, false);
  },
  credentials: false,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// preflight
app.options("*", cors());

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// init default data
initializeData();

// health
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/health", (req, res) => res.json({ ok: true }));

// routes
app.use("/api/admin/users", adminUsersRoutes);


app.use("/api/ai", aiRouter);

app.use("/api/auth", authRoutes);
app.use("/api/surveys", surveysRouter);
app.use("/api/employees", employeesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/zones", zonesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/responses", responsesRoutes);
app.use("/api/ai", aiRoutes);

// fallback 404 (полезно, чтобы видеть что реально вызывается)
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.path });
});

app.listen(PORT,async  () => {
 console.log(`Server running on http://localhost:${PORT}`);
  await initializeData();

});
