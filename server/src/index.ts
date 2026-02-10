import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import surveysRoutes from './routes/surveys.js';
import employeesRoutes from './routes/employees.js';
import dashboardRoutes from './routes/dashboard.js';
import zonesRoutes from './routes/zones.js';
import notificationsRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';
import responsesRoutes from './routes/responses.js';
import { initializeData } from './data/initialize.js';
import adminUsers from './routes/adminUsers.js';
import usersRouter from './routes/adminUsers.js';
import aiRouter from "./routes/ai.js";
import surveysRouter from './routes/surveys.js';
import employeesRouter from './routes/employees.js';
import dashboardRouter from "./routes/dashboard.js";
import authRouter from "./routes/auth.js";

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: (origin, callback) => {
      // разрешаем серверные запросы / postman
      if (!origin) return callback(null, true);

      // разрешаем все vercel preview + production
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


app.use(express.json({ limit: "2mb" }));
app.use('/api/admin/users', adminUsers);

// Initialize default data
initializeData();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRouter);
app.use("/api/ai", aiRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/auth", authRouter);
app.use("/api/surveys", surveysRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/employees", employeesRouter);
app.use('/api/surveys', surveysRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/responses', responsesRoutes);
app.use('/api/surveys', surveysRouter);
app.use('/api/employees', employeesRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.get("/health",(req,res)=>res.json({ok:true}))

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
