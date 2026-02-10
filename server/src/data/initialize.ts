import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');

export async function initializeData() {
  // Create data directory if it doesn't exist
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Initialize users.json
  const usersPath = path.join(DATA_DIR, 'users.json');
  try {
    await fs.access(usersPath);
  } catch {
    const defaultUsers = [
      {
        id: '1',
        email: 'admin@psycheck.com',
        password: 'admin123', // In production, hash this
        name: 'Admin',
        role: 'admin',
      },
      {
        id: '2',
        email: 'hr@psycheck.com',
        password: 'hr123', // In production, hash this
        name: 'HR Manager',
        role: 'hr',
      },
      {
        id: '3',
        email: 'employee@psycheck.com',
        password: 'emp123', // In production, hash this
        name: 'Test Employee',
        role: 'employee',
        department: 'Разработка',
        position: 'Frontend Developer',
      },
    ];
    await fs.writeFile(usersPath, JSON.stringify(defaultUsers, null, 2));
  }

  // Initialize departments.json
  const departmentsPath = path.join(DATA_DIR, 'departments.json');
  try {
    await fs.access(departmentsPath);
  } catch {
    const defaultDepartments = [
      { id: '1', name: 'Поддержка', employeeCount: 18 },
      { id: '2', name: 'Продажи', employeeCount: 22 },
      { id: '3', name: 'Разработка', employeeCount: 30 },
      { id: '4', name: 'HR', employeeCount: 6 },
    ];
    await fs.writeFile(departmentsPath, JSON.stringify(defaultDepartments, null, 2));
  }

  // Initialize surveys.json
  const surveysPath = path.join(DATA_DIR, 'surveys.json');
  try {
    await fs.access(surveysPath);
  } catch {
    const defaultSurveys = [
      {
        id: '1',
        name: 'Еженедельный пульс',
        status: 'active',
        periodicity: 'каждую пятницу',
        questionCount: 5,
        anonymityThreshold: 7,
        departments: ['1', '2', '3', '4'],
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Чек стресс/нагрузка',
        status: 'draft',
        periodicity: 'вручную',
        questionCount: 7,
        anonymityThreshold: 7,
        departments: ['1', '2', '3'],
        createdAt: new Date().toISOString(),
      },
    ];
    await fs.writeFile(surveysPath, JSON.stringify(defaultSurveys, null, 2));
  }

  // Initialize responses.json
  const responsesPath = path.join(DATA_DIR, 'responses.json');
  try {
    await fs.access(responsesPath);
  } catch {
    await fs.writeFile(responsesPath, JSON.stringify([], null, 2));
  }

  console.log('Data initialized successfully');
}
