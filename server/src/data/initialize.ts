import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";

/**
 * Инициализация БД при первом запуске.
 * Создаёт дефолтных пользователей если таблица пустая.
 * Использует Prisma (PostgreSQL) — JSON файлы больше не нужны.
 */
export async function initializeData() {
  try {
    // Проверяем соединение с БД
    await prisma.$connect();
    console.log("✅ Database connected");

    // Проверяем, есть ли уже пользователи
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      console.log("🌱 Seeding default users...");

      // Хешируем пароли — НЕ храним plain text
      const [adminHash, hrHash, managerHash, empHash] = await Promise.all([
        bcrypt.hash("Admin@123", 10),
        bcrypt.hash("HR@123456", 10),
        bcrypt.hash("Manager@123", 10),
        bcrypt.hash("Employee@123", 10),
      ]);

      await prisma.user.createMany({
        data: [
          {
            email: "admin@moodmetrics.kz",
            password: adminHash,
            name: "Администратор",
            role: "admin",
            approved: true,
          },
          {
            email: "hr@moodmetrics.kz",
            password: hrHash,
            name: "HR Менеджер",
            role: "hr",
            department: "HR",
            position: "HR Manager",
            approved: true,
          },
          {
            email: "manager@moodmetrics.kz",
            password: managerHash,
            name: "Руководитель",
            role: "manager",
            department: "Разработка",
            position: "Team Lead",
            approved: true,
          },
          {
            email: "employee@moodmetrics.kz",
            password: empHash,
            name: "Тестовый Сотрудник",
            role: "employee",
            department: "Разработка",
            position: "Frontend Developer",
            approved: true,
          },
        ],
      });

      console.log("✅ Default users created");
      console.log("   admin@moodmetrics.kz   / Admin@123");
      console.log("   hr@moodmetrics.kz      / HR@123456");
      console.log("   manager@moodmetrics.kz / Manager@123");
      console.log("   employee@moodmetrics.kz/ Employee@123");
    } else {
      console.log(`✅ Database has ${userCount} user(s), skipping seed`);
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    // В продакшене — не падаем, просто логируем
    if (process.env.NODE_ENV === "production") {
      console.error("Continuing without seed...");
    } else {
      throw error;
    }
  }
}