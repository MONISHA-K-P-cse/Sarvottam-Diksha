import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get public free study resources & announcements
router.get('/', async (req, res) => {
  try {
    const resources = await prisma.freeResource.findMany({ orderBy: { createdAt: 'desc' } });
    const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });

    res.json({ success: true, resources, announcements });
  } catch (error) {
    console.error('Fetch Free Resources Error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve study resources.' });
  }
});

export default router;
