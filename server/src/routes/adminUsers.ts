import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/users
 * Список пользователей (только admin/hr)
 */
router.get('/', authenticate, requireRole('admin', 'hr'), async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      approved: true,
      department: true,
      position: true,
      createdAt: true,
    },
  });

  res.json(users);
});

/**
 * PUT /api/users/:id/approve
 * Подтвердить пользователя (только admin)
 */
router.put('/:id/approve', authenticate, requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  const updated = await prisma.user.update({
    where: { id },
    data: { approved: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      approved: true,
    },
  });

  res.json(updated);
});

export default router;
