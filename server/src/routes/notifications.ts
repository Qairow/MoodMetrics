import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const notifications = [
    {
      id: '1',
      type: 'warning',
      title: 'Рост стресса в отделе "Поддержка"',
      description: 'За последние 14 дней индекс стресса вырос на +12 пунктов.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      type: 'warning',
      title: 'Падение удовлетворённости в "Продажи"',
      description: 'Отмечается снижение удовлетворённости и рост конфликтности.',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'success',
      title: 'Охват опроса улучшился',
      description: 'Охват вырос до 62% благодаря напоминаниям.',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  res.json(notifications);
});

export default router;
