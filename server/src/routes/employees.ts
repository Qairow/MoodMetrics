import { Router } from "express";
import { authenticate, AuthRequest, requireRole } from "../middleware/auth.js";
import { prisma } from "../prisma.js";

const router = Router();

/**
 * GET /api/employees/departments
 * список отделов (из users.department)
 */
router.get("/departments", authenticate, async (_req, res) => {
  const rows = await prisma.user.findMany({
    distinct: ["department"],
    where: { department: { not: null } },
    select: { department: true },
  });
  res.json(rows.map((r) => r.department).filter(Boolean));
});

/**
 * GET /api/employees
 * подтверждённые сотрудники (admin/hr/manager)
 */
router.get("/", authenticate, requireRole("admin", "hr", "manager"), async (_req: AuthRequest, res) => {
  const employees = await prisma.user.findMany({
    where: { approved: true, role: { in: ["employee", "manager", "hr"] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      position: true,
      approved: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(employees);
});

export default router;
