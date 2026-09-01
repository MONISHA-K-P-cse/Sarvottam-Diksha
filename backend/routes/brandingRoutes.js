import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get active platform branding settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.brandingSettings.findUnique({ where: { id: 'default' } });

    if (!settings) {
      settings = await prisma.brandingSettings.create({
        data: {
          id: 'default',
          appName: 'Sarvottam Diksha',
          tagline: 'Delve in concepts with MANIKA',
          logoUrl: '/logo.png',
          primaryColor: '#EA580C',
          secondaryColor: '#65A30D',
          contactEmail: 'contact@sarvottamdiksha.com',
          contactPhone: '+91 99646 77802',
          address: 'Sarvottam Diksha Learning Center, India'
        }
      });
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Branding Settings Error:', error);
    res.status(500).json({ success: false, error: 'Failed to load branding configuration.' });
  }
});

export default router;
