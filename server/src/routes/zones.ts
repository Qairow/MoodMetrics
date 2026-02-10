import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Mock data for problem zones heatmap
router.get('/heatmap', authenticate, (req, res) => {
  const departments = ['Поддержка', 'Продажи', 'Разработка', 'HR'];
  const factors = ['Стресс', 'Выгорание', 'Удовлетворённость', 'Климат в команде', 'Нагрузка'];

  const heatmap = departments.flatMap(dept =>
    factors.map(factor => {
      let score: number;
      let status: 'ok' | 'risk' | 'critical';

      // Mock scores based on department and factor
      if (dept === 'Разработка' || dept === 'HR') {
        if (factor === 'Нагрузка') {
          score = 7;
          status = 'ok';
        } else {
          score = 84 + Math.floor(Math.random() * 3);
          status = 'critical';
        }
      } else if (dept === 'Поддержка') {
        if (factor === 'Нагрузка') {
          score = 53;
          status = 'ok';
        } else {
          score = 22 + Math.floor(Math.random() * 10);
          status = 'ok';
        }
      } else {
        // Продажи
        if (factor === 'Нагрузка') {
          score = 60;
          status = 'risk';
        } else {
          score = 29 + Math.floor(Math.random() * 10);
          status = 'ok';
        }
      }

      return {
        department: dept,
        factor,
        score,
        status,
      };
    })
  );

  res.json(heatmap);
});

export default router;
