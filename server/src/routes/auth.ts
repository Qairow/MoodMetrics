import express from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { generateToken } from "../utils/auth.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    if (user.approved === false) {
      return res.status(403).json({ error: "Аккаунт ожидает подтверждения администратором" });
    }

    const token = generateToken(user.id, user.role);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        position: user.position,
        approved: user.approved,
      },
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, department, position } = req.body as {
      email: string;
      password: string;
      name: string;
      role?: "admin" | "hr" | "manager" | "employee";
      department?: string;
      position?: string;
    };

    // ✅ пароль >= 6
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Пароль должен быть минимум 6 символов" });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const finalRole = role || "employee";

    // ✅ HR/admin можно auto-approve, остальных пусть подтверждает админ
    const autoApproved = finalRole === "admin" || finalRole === "hr";

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: finalRole,
        department,
        position,
        approved: autoApproved,
      },
    });

    // ❗ если не approved — токен не выдаём
    if (!newUser.approved) {
      return res.status(201).json({
        message: "Аккаунт создан и ожидает подтверждения администратором",
      });
    }

    const token = generateToken(newUser.id, newUser.role);

    return res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        position: newUser.position,
        approved: newUser.approved,
      },
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
