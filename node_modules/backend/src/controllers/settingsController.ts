import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    
    // Default values if not set
    if (!settingsMap['PROJECT_NAME']) settingsMap['PROJECT_NAME'] = 'Power Plant Alpha';
    if (!settingsMap['RUNNING_NO_FORMAT']) settingsMap['RUNNING_NO_FORMAT'] = 'DISC-YYYY-SEQ';
    if (!settingsMap['EMAIL_NOTIFICATIONS']) settingsMap['EMAIL_NOTIFICATIONS'] = 'false';

    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  const settings = req.body; // Expecting { PROJECT_NAME: '...', ... }
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    await prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(settings)) {
        await tx.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        });
      }
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
