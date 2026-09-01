import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get notifications for current user or admin
router.get('/', requireAuth, async (req, res) => {
  try {
    let notifications;
    if (req.user.role === 'ADMIN') {
      notifications = await prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30
      });
    } else {
      notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { userId: req.user.id },
            { userId: null }
          ]
        },
        orderBy: { createdAt: 'desc' },
        take: 30
      });
    }

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve notifications.' });
  }
});

// Mark notifications as read
router.post('/mark-read', requireAuth, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true }
    });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notifications.' });
  }
});

export default router;
