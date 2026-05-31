import express from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { generateToken } from "../utils/auth.js";

const router = express.Router();

// ─── Rate Limiter ────────────────────────────────────────────────────────────
// Максимум 10 попыток входа за 15 минут с одного IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Слишком много попыток входа. Попробуйте через 15 минут." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Zod схемы ──────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string({ required_error: "Email обязателен" })
    .email("Некорректный формат email")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Пароль обязателен" })
    .min(1, "Пароль не может быть пустым"),
});

const registerSchema = z.object({
  email: z
    .string({ required_error: "Email обязателен" })
    .email("Некорректный формат email")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Пароль обязателен" })
    .min(6, "Пароль должен быть минимум 6 символов")
    .max(72, "Пароль слишком длинный"),
  name: z
    .string({ required_error: "Имя обязательно" })
    .min(2, "Имя слишком короткое")
    .max(100, "Имя слишком длинное")
    .trim(),
  role: z
    .enum(["admin", "hr", "manager", "employee"])
    .optional()
    .default("employee"),
  department: z.string().max(100).trim().optional(),
  position: z.string().max(100).trim().optional(),
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post("/login", loginLimiter, async (req, res) => {
  // Валидация
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors[0]?.message ?? "Неверные данные";
    return res.status(400).json({ error: message });
  }

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Одинаковая ошибка — не даём угадать, существует ли email
    if (!user) return res.status(401).json({ error: "Неверный email или пароль" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Неверный email или пароль" });

    if (user.approved === false) {
      return res
        .status(403)
        .json({ error: "Аккаунт ожидает подтверждения администратором" });
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
  } catch (err) {
    console.error("[POST /login]", err);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  // Валидация
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors[0]?.message ?? "Неверные данные";
    return res.status(400).json({ error: message });
  }

  const { email, password, name, role, department, position } = result.data;

  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: "Пользователь уже существует" });

    const hashed = await bcrypt.hash(password, 10);

    // HR и admin — автоматически одобряются
    const autoApproved = role === "admin" || role === "hr";

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role,
        department,
        position,
        approved: autoApproved,
      },
    });

    if (!newUser.approved) {
      return res.status(201).json({
        message: "Аккаунт создан и ожидает подтверждения администратором",
      });
    }

    const token = generateToken(newUser.id, newUser.role);

    return res.status(201).json({
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
  } catch (err) {
    console.error("[POST /register]", err);
    return res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

export default router;