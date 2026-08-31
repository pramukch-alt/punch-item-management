import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { Discipline, Category } from '@prisma/client';

export const getPunchItems = async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.punchItem.findMany({
      include: {
        created_by: {
          select: { id: true, email: true, name: true, signature_image_path: true }
        },
        history: {
          include: {
            user: {
              select: { id: true, email: true, name: true, signature_image_path: true }
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const getPunchItemById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const item = await prisma.punchItem.findUnique({
      where: { id },
      include: {
        created_by: {
          select: { id: true, email: true, name: true, role: true, signature_image_path: true }
        },
        history: {
          include: {
            user: {
              select: { id: true, email: true, name: true, role: true, signature_image_path: true }
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const createPunchItem = async (req: AuthRequest, res: Response) => {
  const { discipline, description, category, kks_tag, package: pkg, system, location } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    // Transaction to safely generate running number
    const newItem = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const yearSuffix = year.toString(); // Or last two digits if preferred, spec says CIV-2026-0001
      
      const lastItem = await tx.punchItem.findFirst({
        where: {
          discipline: discipline as Discipline,
          running_no: { startsWith: `${discipline}-${yearSuffix}-` }
        },
        orderBy: { running_no: 'desc' }
      });

      let nextNumber = 1;
      if (lastItem) {
        const parts = lastItem.running_no.split('-');
        nextNumber = parseInt(parts[2], 10) + 1;
      }

      const paddedNumber = nextNumber.toString().padStart(4, '0');
      const running_no = `${discipline}-${yearSuffix}-${paddedNumber}`;

      let before_image_path = null;
      let before_image_2_path = null;
      let after_image_path = null;
      let after_image_2_path = null;
      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files['before_image']) before_image_path = `/uploads/punch-items/${files['before_image'][0].filename}`;
        if (files['before_image_2']) before_image_2_path = `/uploads/punch-items/${files['before_image_2'][0].filename}`;
        if (files['after_image']) after_image_path = `/uploads/punch-items/${files['after_image'][0].filename}`;
        if (files['after_image_2']) after_image_2_path = `/uploads/punch-items/${files['after_image_2'][0].filename}`;
      }

      const punchItem = await tx.punchItem.create({
        data: {
          running_no,
          discipline: discipline as Discipline,
          category: (category || 'C') as Category,
          package: pkg || null,
          system: system || null,
          location: location || null,
          kks_tag: kks_tag || null,
          description,
          status: 'OPEN',
          created_by_id: userId,
          before_image_path,
          before_image_2_path,
          after_image_path,
          after_image_2_path
        }
      });

      await tx.punchItemHistory.create({
        data: {
          punch_item_id: punchItem.id,
          user_id: userId,
          action: 'CREATED'
        }
      });

      return punchItem;
    });

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const updatePunchItem = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { description, discipline, category, kks_tag, before_image_desc, after_image_desc, package: pkg, system } = req.body;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let before_image_path = undefined;
    let before_image_2_path = undefined;
    let after_image_path = undefined;
    let after_image_2_path = undefined;
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files['before_image']) before_image_path = `/uploads/punch-items/${files['before_image'][0].filename}`;
      if (files['before_image_2']) before_image_2_path = `/uploads/punch-items/${files['before_image_2'][0].filename}`;
      if (files['after_image']) after_image_path = `/uploads/punch-items/${files['after_image'][0].filename}`;
      if (files['after_image_2']) after_image_2_path = `/uploads/punch-items/${files['after_image_2'][0].filename}`;
    }

    const updated = await prisma.punchItem.update({
      where: { id },
      data: { 
        ...(description && { description }), 
        ...(discipline && { discipline: discipline as Discipline }),
        ...(category && { category: category as Category }),
        ...(pkg !== undefined && { package: pkg || null }),
        ...(system !== undefined && { system: system || null }),
        ...(kks_tag !== undefined && { kks_tag: kks_tag || null }),
        ...(before_image_desc !== undefined && { before_image_desc }),
        ...(after_image_desc !== undefined && { after_image_desc }),
        updated_at: new Date(),
        ...(before_image_path && { before_image_path }),
        ...(before_image_2_path && { before_image_2_path }),
        ...(after_image_path && { after_image_path }),
        ...(after_image_2_path && { after_image_2_path })
      }
    });

    await prisma.punchItemHistory.create({
      data: {
        punch_item_id: updated.id,
        user_id: userId,
        action: 'UPDATED'
      }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
