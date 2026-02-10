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

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/api/admin/users', adminUsers);

// Initialize default data
initializeData();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRouter);
app.use("/api/ai", aiRouter);
app.use("/api/dashboard", dashboardRouter);

app.use('/api/surveys', surveysRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/responses', responsesRoutes);
app.use('/api/surveys', surveysRouter);
app.use('/api/employees', employeesRouter);
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.get("/health",(req,res)=>res.json({ok:true}))

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
