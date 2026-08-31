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

export const updateSystemProgress = async (req: AuthRequest, res: Response) => {
  const { systemProgress } = req.body;
  if (!systemProgress) return res.status(400).json({ message: 'Missing systemProgress data' });
  
  try {
    await prisma.setting.upsert({
      where: { key: 'SYSTEM_PROGRESS' },
      update: { value: JSON.stringify(systemProgress) },
      create: { key: 'SYSTEM_PROGRESS', value: JSON.stringify(systemProgress) }
    });
    res.json({ message: 'System progress updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

import fs from 'fs';
import path from 'path';

export const factoryReset = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Delete DB Records
    await prisma.$transaction([
      prisma.punchItemHistory.deleteMany({}),
      prisma.punchItem.deleteMany({}),
      prisma.setting.deleteMany({
        where: { key: 'SYSTEM_PROGRESS' }
      })
    ]);

    // 2. Delete Uploaded Images
    const uploadsDir = path.join(__dirname, '../../uploads/punch-items');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        if (file !== '.gitkeep' && file !== '.placeholder') {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      }
    }

    res.json({ message: 'Factory reset completed successfully. All punch items and images have been cleared.' });
  } catch (error) {
    console.error('Factory Reset Error:', error);
    res.status(500).json({ message: 'Failed to perform factory reset', error });
  }
};

import nodemailer from 'nodemailer';

export const testEmail = async (req: AuthRequest, res: Response) => {
  const { host, port, user, pass } = req.body;
  if (!host || !port || !user || !pass) {
    return res.status(400).json({ message: 'Missing SMTP credentials' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const userRec = await prisma.user.findUnique({ where: { id: req.user?.id } });
    if (!userRec || !userRec.email) {
      return res.status(400).json({ message: 'User email not found' });
    }

    const info = await transporter.sendMail({
      from: `"Punch Item System" <${user}>`,
      to: user, // Send to the sender's own email to verify it works!
      subject: "Test Email from Punch Item System",
      text: "This is a test email to verify your SMTP configuration.",
      html: "<b>This is a test email to verify your SMTP configuration.</b>",
    });

    res.json({ message: 'Test email sent successfully', infoId: info.messageId });
  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
};
