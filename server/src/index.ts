import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.js";
import surveysRoutes from "./routes/surveys.js";
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

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    credentials: true,
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
app.use("/api/auth", authRoutes);
app.use("/api/surveys", surveysRoutes);
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
