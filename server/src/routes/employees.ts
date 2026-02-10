import express from "express";
import { prisma } from "../prisma.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

// сотрудники = approved=true + role employee/manager
router.get(
  "/",
  authenticate,
  requireRole("admin", "hr", "manager"),
  async (_req, res) => {
    const employees = await prisma.user.findMany({
      where: {
        approved: true,
        role: { in: ["employee", "manager"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        createdAt: true,
      },
    });

    res.json(employees);
  }
);

// список отделов
router.get(
  "/departments",
  authenticate,
  requireRole("admin", "hr", "manager"),
  async (_req, res) => {
    const depts = await prisma.user.findMany({
      where: { approved: true, department: { not: null } },
      distinct: ["department"],
      select: { department: true },
      orderBy: { department: "asc" },
    });

    res.json(depts.map((x) => ({ name: x.department! })));
  }
);

export default router;
