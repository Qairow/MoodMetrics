import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── survey definitions ────────────────────────────────────────────────────────

const SURVEYS = [
  {
    name: 'Еженедельный пульс',
    status: 'active',
    periodicity: 'Каждую пятницу',
    anonymityThreshold: 7,
    departments: ['Разработка', 'HR', 'Продажи', 'Поддержка'],
    questions: [
      { text: 'Как вы оцениваете свой уровень энергии на этой неделе?', type: 'scale' },
      { text: 'Удалось ли вам завершить запланированные задачи?', type: 'scale' },
      { text: 'Как вы оцениваете атмосферу в команде?', type: 'scale' },
      { text: 'Чувствуете ли вы поддержку со стороны руководителя?', type: 'scale' },
      { text: 'Что можно улучшить на следующей неделе?', type: 'text' },
    ],
  },
  {
    name: 'Стресс и нагрузка',
    status: 'active',
    periodicity: 'Каждые 2 недели',
    anonymityThreshold: 5,
    departments: ['Разработка', 'Продажи'],
    questions: [
      { text: 'Как вы оцениваете свой уровень стресса за последние 2 недели?', type: 'scale' },
      { text: 'Успеваете ли вы справляться с рабочей нагрузкой?', type: 'scale' },
      { text: 'Достаточно ли у вас времени на отдых и восстановление?', type: 'scale' },
      { text: 'Есть ли факторы, которые мешают вашей продуктивности?', type: 'text' },
      { text: 'Насколько вы удовлетворены work-life balance?', type: 'scale' },
      { text: 'Что помогло бы снизить вашу нагрузку?', type: 'text' },
    ],
  },
  {
    name: 'Удовлетворённость командой',
    status: 'active',
    periodicity: 'Ежемесячно',
    anonymityThreshold: 7,
    departments: ['Разработка', 'HR', 'Маркетинг'],
    questions: [
      { text: 'Как вы оцениваете взаимодействие внутри вашей команды?', type: 'scale' },
      { text: 'Чувствуете ли вы себя услышанным на встречах?', type: 'scale' },
      { text: 'Насколько вы доверяете своим коллегам?', type: 'scale' },
      { text: 'Есть ли в команде психологически безопасная атмосфера?', type: 'yesno' },
      { text: 'Что мешает эффективной работе команды?', type: 'text' },
    ],
  },
  {
    name: 'Онбординг — первые 30 дней',
    status: 'draft',
    periodicity: 'Разово',
    anonymityThreshold: 3,
    departments: ['HR'],
    questions: [
      { text: 'Насколько вы понимаете свои задачи и зону ответственности?', type: 'scale' },
      { text: 'Получили ли вы достаточно информации для начала работы?', type: 'scale' },
      { text: 'Чувствуете ли вы поддержку от команды?', type: 'scale' },
      { text: 'Что можно улучшить в процессе адаптации?', type: 'text' },
      { text: 'Соответствуют ли ожидания реальности?', type: 'yesno' },
    ],
  },
  {
    name: 'Квартальный обзор',
    status: 'draft',
    periodicity: 'Ежеквартально',
    anonymityThreshold: 10,
    departments: ['Разработка', 'HR', 'Продажи', 'Поддержка', 'Маркетинг', 'Финансы'],
    questions: [
      { text: 'Как вы оцениваете последний квартал в целом?', type: 'scale' },
      { text: 'Чувствуете ли вы профессиональный рост?', type: 'scale' },
      { text: 'Удовлетворены ли вы своими достижениями за квартал?', type: 'scale' },
      { text: 'Насколько вы удовлетворены условиями работы?', type: 'scale' },
      { text: 'Рассматриваете ли вы смену работы в ближайшие 6 месяцев?', type: 'yesno' },
      { text: 'Что компания могла бы сделать лучше?', type: 'text' },
      { text: 'Ваши главные достижения за квартал', type: 'text' },
    ],
  },
  {
    name: 'Оценка руководителя',
    status: 'draft',
    periodicity: 'Раз в полгода',
    anonymityThreshold: 10,
    departments: ['Разработка', 'Продажи'],
    questions: [
      { text: 'Ваш руководитель понятно ставит задачи', type: 'scale' },
      { text: 'Вы получаете своевременную обратную связь', type: 'scale' },
      { text: 'Руководитель поддерживает ваш карьерный рост', type: 'scale' },
      { text: 'Руководитель справедливо распределяет нагрузку', type: 'scale' },
      { text: 'Что руководителю стоит делать иначе?', type: 'text' },
    ],
  },
  {
    name: 'Климат после изменений',
    status: 'draft',
    periodicity: 'Разово',
    anonymityThreshold: 5,
    departments: ['Разработка', 'HR'],
    questions: [
      { text: 'Как вы оцениваете недавние изменения в компании?', type: 'scale' },
      { text: 'Чувствуете ли вы неопределённость из-за изменений?', type: 'yesno' },
      { text: 'Получили ли вы достаточно информации об изменениях?', type: 'scale' },
      { text: 'Что вас беспокоит больше всего?', type: 'text' },
    ],
  },
  {
    name: 'Пульс — декабрь 2024',
    status: 'archived',
    periodicity: 'Разово',
    anonymityThreshold: 7,
    departments: ['Разработка', 'HR', 'Продажи'],
    questions: [
      { text: 'Как вы оцениваете 2024 год?', type: 'scale' },
      { text: 'Каковы ваши ожидания от 2025?', type: 'text' },
    ],
  },
];

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Users
  const [adminHash, hrHash, managerHash, empHash] = await Promise.all([
    bcrypt.hash('Admin@123', 10),
    bcrypt.hash('HR@123456', 10),
    bcrypt.hash('Manager@123', 10),
    bcrypt.hash('Employee@123', 10),
  ]);

  await prisma.user.upsert({
    where: { email: 'admin@moodmetrics.kz' },
    update: {},
    create: { email: 'admin@moodmetrics.kz', password: adminHash, name: 'Администратор', role: 'admin', approved: true },
  });

  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@moodmetrics.kz' },
    update: {},
    create: { email: 'hr@moodmetrics.kz', password: hrHash, name: 'HR Менеджер', role: 'hr', department: 'HR', position: 'HR Manager', approved: true },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@moodmetrics.kz' },
    update: {},
    create: { email: 'manager@moodmetrics.kz', password: managerHash, name: 'Руководитель', role: 'manager', department: 'Разработка', position: 'Team Lead', approved: true },
  });

  const empUser = await prisma.user.upsert({
    where: { email: 'employee@moodmetrics.kz' },
    update: {},
    create: { email: 'employee@moodmetrics.kz', password: empHash, name: 'Тестовый Сотрудник', role: 'employee', department: 'Разработка', position: 'Frontend Developer', approved: true },
  });

  console.log('✅ Users seeded');

  // 2. Survey templates + surveys (skip if already exist)
  const templateCount = await prisma.surveyTemplate.count();
  if (templateCount > 0) {
    console.log('✅ Templates already exist, skipping');
  } else {
    for (const def of SURVEYS) {
      const template = await prisma.surveyTemplate.create({
        data: {
          name: def.name,
          questions: {
            create: def.questions.map(q => ({ text: q.text, type: q.type })),
          },
        },
        include: { questions: true },
      });

      await prisma.survey.create({
        data: {
          name: def.name,
          templateId: template.id,
          departments: def.departments,
          periodicity: def.periodicity,
          anonymityThreshold: def.anonymityThreshold,
          status: def.status === 'archived' ? 'closed' : def.status,
          archived: def.status === 'archived',
        },
      });

      console.log(`  📋 Created: ${def.name} [${def.status}]`);
    }
    console.log('✅ Templates and surveys seeded');
  }

  // 3. Survey responses (skip if already exist)
  const responseCount = await prisma.surveyResponse.count();
  if (responseCount > 0) {
    console.log('✅ Responses already exist, skipping');
  } else {
    // Find the "Еженедельный пульс" survey and template
    const pulseTemplate = await prisma.surveyTemplate.findFirst({
      where: { name: 'Еженедельный пульс' },
      include: { questions: true, surveys: true },
    });

    const stressTemplate = await prisma.surveyTemplate.findFirst({
      where: { name: 'Стресс и нагрузка' },
      include: { questions: true, surveys: true },
    });

    if (pulseTemplate?.surveys[0]) {
      const survey = pulseTemplate.surveys[0];
      const scaleQs = pulseTemplate.questions.filter(q => q.type === 'scale');

      // manager (Разработка): good scores → green zone
      await prisma.surveyResponse.create({
        data: {
          surveyId: survey.id,
          userId: managerUser.id,
          answers: scaleQs.map((q, i) => ({ questionId: q.id, value: [4, 5, 4, 4][i % 4] })),
        },
      });

      // hr (HR): medium scores → yellow zone
      await prisma.surveyResponse.create({
        data: {
          surveyId: survey.id,
          userId: hrUser.id,
          answers: scaleQs.map((q, i) => ({ questionId: q.id, value: [3, 3, 3, 4][i % 4] })),
        },
      });

      // employee (Разработка): low scores → red zone
      await prisma.surveyResponse.create({
        data: {
          surveyId: survey.id,
          userId: empUser.id,
          answers: scaleQs.map((q, i) => ({ questionId: q.id, value: [2, 1, 2, 2][i % 4] })),
        },
      });

      console.log('  📊 Pulse survey responses created');
    }

    if (stressTemplate?.surveys[0]) {
      const survey = stressTemplate.surveys[0];
      const scaleQs = stressTemplate.questions.filter(q => q.type === 'scale');

      await prisma.surveyResponse.create({
        data: {
          surveyId: survey.id,
          userId: managerUser.id,
          answers: scaleQs.map((q, i) => ({ questionId: q.id, value: [2, 4, 4, 4][i % 4] })),
        },
      });

      await prisma.surveyResponse.create({
        data: {
          surveyId: survey.id,
          userId: empUser.id,
          answers: scaleQs.map((q, i) => ({ questionId: q.id, value: [4, 2, 1, 2][i % 4] })),
        },
      });

      console.log('  📊 Stress survey responses created');
    }

    console.log('✅ Responses seeded');
  }

  console.log('\n✨ Seed complete');
  console.log('   Логин admin:    admin@moodmetrics.kz / Admin@123');
  console.log('   Логин hr:       hr@moodmetrics.kz / HR@123456');
  console.log('   Логин manager:  manager@moodmetrics.kz / Manager@123');
  console.log('   Логин employee: employee@moodmetrics.kz / Employee@123');
}

main()
  .catch(e => { console.error(e); throw e; })
  .finally(() => prisma.$disconnect());
