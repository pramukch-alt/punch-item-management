import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const lowercaseEmail = email?.trim().toLowerCase();
  
  console.log(`[LOGIN ATTEMPT] Received email: "${email}", password length: ${password?.length}, lowercaseEmail: "${lowercaseEmail}"`);

  try {
    const user = await prisma.user.findUnique({ 
      where: { email: lowercaseEmail },
      include: { project: { include: { package: true } } }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password?.trim(), user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'SUPERADMIN' && user.project) {
      if (user.project.status === 'SUSPENDED') {
        return res.status(403).json({ message: 'Project subscription is currently suspended. Please contact administrator.' });
      }
      if (user.project.status === 'EXPIRED' || (user.project.end_date && new Date(user.project.end_date) < new Date())) {
        return res.status(403).json({ message: 'Project subscription has expired. Please contact administrator to renew.' });
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, project_id: user.project_id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        discipline: user.discipline,
        signature_image_path: user.signature_image_path,
        project_id: user.project_id,
        project_name: user.project?.name,
        project_status: user.project?.status,
        end_date: user.project?.end_date,
        pwa_enabled: user.project?.package?.pwa_enabled ?? true, // fallback to true for backward compatibility or default
        report_enabled: user.project?.package?.report_enabled ?? true,
        max_punch_items: user.project?.package?.max_punch_items ?? null
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
