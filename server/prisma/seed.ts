import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/prisma.js";

async function main() {
  const ADMIN_EMAIL = "admin@psycheck.com";
  const ADMIN_PASSWORD = "admin123";

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      role: "admin",
      approved: true,
      password: passwordHash,
      name: "Admin",
    },
    create: {
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: "admin",
      approved: true,
      name: "Admin",
    },
  });

  console.log(`✅ Admin ready: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  const templates = [
    {
      name: "Пульс-опрос (1–5)",
      questions: [
        "Уровень стресса за последние 7 дней",
        "Насколько хватает энергии на работу",
        "Насколько комфортна атмосфера в команде",
        "Баланс работы и личной жизни",
        "Общая удовлетворённость неделей",
      ],
    },
    {
      name: "Анти-выгорание (1–5)",
      questions: [
        "Усталость: насколько часто к концу дня нет сил",
        "Сон: насколько удаётся высыпаться",
        "Перегруз: сколько задач одновременно давит",
        "Восстановление: получается ли нормально отдыхать",
        "Выгорание: есть ли ощущение эмоционального истощения",
        "Дедлайны: насколько реалистичны сроки",
        "Поддержка: можно ли попросить помощь у команды/лида",
        "Мотивация: насколько интересно работать сейчас",
      ],
    },
    {
      name: "Командный климат (1–5)",
      questions: [
        "Коммуникация: насколько легко договориться с коллегами",
        "Напряжение: как часто возникают конфликты/споры",
        "Поддержка: безопасно ли высказывать мнение",
        "Уважение: ощущаешь ли уважение в команде",
        "Ясность: понятно ли распределены роли и ответственность",
        "Справедливость: насколько честно распределяется нагрузка",
        "Общее: комфортно ли работать в этой команде",
      ],
    },
  ];

  for (const t of templates) {
    const exists = await prisma.surveyTemplate.findFirst({ where: { name: t.name } });
    if (exists) {
      console.log(`ℹ️ Template exists: ${t.name}`);
      continue;
    }

    await prisma.surveyTemplate.create({
      data: {
        name: t.name,
        questions: {
          create: t.questions.map((text) => ({
            text,
            type: "scale",
          })),
        },
      },
    });

    console.log(`✅ Template created: ${t.name}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
