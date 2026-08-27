import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { Role } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/signatures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        discipline: true,
        signature_image_path: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  const { email, password, role, name, discipline } = req.body;
  const lowercaseEmail = email?.trim().toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email: lowercaseEmail } });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    
    // Handle signature upload if provided
    let signature_image_path = null;
    if (req.file) {
      signature_image_path = `/uploads/signatures/${req.file.filename}`;
    }

    const newUser = await prisma.user.create({
      data: {
        email: lowercaseEmail,
        password_hash,
        name: name || null,
        role: role as Role,
        discipline: discipline || null,
        signature_image_path
      },
      select: { id: true, email: true, name: true, role: true, discipline: true, signature_image_path: true }
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { email, password, role, name, discipline } = req.body;
  const lowercaseEmail = email?.trim().toLowerCase();

  try {
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) return res.status(404).json({ message: 'User not found' });

    if (lowercaseEmail && lowercaseEmail !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: lowercaseEmail } });
      if (emailTaken) return res.status(400).json({ message: 'Email already exists' });
    }

    const updateData: any = {};
    if (lowercaseEmail) updateData.email = lowercaseEmail;
    if (role) updateData.role = role as Role;
    if (name !== undefined) updateData.name = name || null;
    if (discipline !== undefined) updateData.discipline = discipline || null;
    
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      updateData.signature_image_path = `/uploads/signatures/${req.file.filename}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, discipline: true, signature_image_path: true }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
