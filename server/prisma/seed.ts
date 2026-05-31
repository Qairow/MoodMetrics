import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Пользователи ──────────────────────────────────────────────
  const [adminHash, hrHash, managerHash, empHash] = await Promise.all([
    bcrypt.hash('Admin@123', 10),
    bcrypt.hash('HR@123456', 10),
    bcrypt.hash('Manager@123', 10),
    bcrypt.hash('Employee@123', 10),
  ]);

  await prisma.user.upsert({
    where: { email: 'admin@moodmetrics.kz' },
    update: {},
    create: {
      email: 'admin@moodmetrics.kz',
      password: adminHash,
      name: 'Администратор',
      role: 'admin',
      approved: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'hr@moodmetrics.kz' },
    update: {},
    create: {
      email: 'hr@moodmetrics.kz',
      password: hrHash,
      name: 'HR Менеджер',
      role: 'hr',
      department: 'HR',
      position: 'HR Manager',
      approved: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'manager@moodmetrics.kz' },
    update: {},
    create: {
      email: 'manager@moodmetrics.kz',
      password: managerHash,
      name: 'Руководитель',
      role: 'manager',
      department: 'Разработка',
      position: 'Team Lead',
      approved: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'employee@moodmetrics.kz' },
    update: {},
    create: {
      email: 'employee@moodmetrics.kz',
      password: empHash,
      name: 'Тестовый Сотрудник',
      role: 'employee',
      department: 'Разработка',
      position: 'Frontend Developer',
      approved: true,
    },
  });

  console.log('✅ Users seeded');

  // ── Опросы ────────────────────────────────────────────────────
  const surveys = [
    // ── Активные ──
    {
      name: 'Еженедельный пульс',
      description: 'Быстрый срез настроения команды за неделю',
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
      description: 'Оценка уровня рабочей нагрузки и стресса',
      status: 'active',
      periodicity: 'Каждые 2 недели',
      anonymityThreshold: 5,
      departments: ['Разработка', 'Продажи'],
      questions: [
        { text: 'Как вы оцениваете свой уровень стресса за последние 2 недели?', type: 'scale' },
        { text: 'Успеваете ли вы справляться с рабочей нагрузкой?', type: 'scale' },
        { text: 'Достаточно ли у вас времени на отдых и восстановление?', type: 'scale' },
        { text: 'Есть ли факторы, которые мешают вашей продуктивности?', type: 'text' },
        { text: 'Чувствуете ли вы признаки выгорания?', type: 'yesno' },
        { text: 'Насколько вы удовлетворены work-life balance?', type: 'scale' },
        { text: 'Что помогло бы снизить вашу нагрузку?', type: 'text' },
      ],
    },
    {
      name: 'Удовлетворённость командой',
      description: 'Оценка командного взаимодействия и климата',
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

    // ── Черновики ──
    {
      name: 'Онбординг — первые 30 дней',
      description: 'Оценка адаптации новых сотрудников',
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
      description: 'Глубокий анализ благополучия за квартал',
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
      description: 'Анонимная обратная связь по менеджменту',
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
      description: 'Реакция команды на организационные изменения',
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

    // ── Архив ──
    {
      name: 'Пульс — декабрь 2024',
      description: 'Итоговый опрос декабря',
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

  for (const survey of surveys) {
    // Используй свою Prisma модель Survey — адаптируй поля под схему
    console.log(`  📋 Survey: ${survey.name} [${survey.status}]`);
    // await prisma.survey.create({ data: { ...survey } });
  }

  console.log('✅ Surveys seeded (раскомментируй prisma.survey.create под свою схему)');
  console.log('\n📊 Итого опросов:', surveys.length);
  console.log('   Активных:  ', surveys.filter(s => s.status === 'active').length);
  console.log('   Черновиков:', surveys.filter(s => s.status === 'draft').length);
  console.log('   В архиве:  ', surveys.filter(s => s.status === 'archived').length);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());