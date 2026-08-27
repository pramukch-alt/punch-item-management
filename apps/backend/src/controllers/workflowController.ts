import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

export const submitToOE = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const item = await prisma.punchItem.update({
      where: { id },
      data: { status: 'SUBMIT_TO_OE' }
    });
    
    await prisma.punchItemHistory.create({
      data: { punch_item_id: id, user_id: userId, action: 'SUBMITTED_TO_OE' }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const submitToOwner = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    const item = await prisma.punchItem.update({
      where: { id },
      data: { status: 'SUBMIT_TO_OWNER' }
    });
    
    await prisma.punchItemHistory.create({
      data: { 
        punch_item_id: id, 
        user_id: userId, 
        action: 'SUBMITTED_TO_OWNER',
        signature_snapshot_path: user?.signature_image_path
      }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const closeItem = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    const item = await prisma.punchItem.update({
      where: { id },
      data: { status: 'CLOSED' }
    });
    
    await prisma.punchItemHistory.create({
      data: { 
        punch_item_id: id, 
        user_id: userId, 
        action: 'APPROVED',
        signature_snapshot_path: user?.signature_image_path
      }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const rejectItem = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { comment } = req.body;
  const userId = req.user?.id;
  
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!comment) return res.status(400).json({ message: 'Comment is mandatory for rejection' });

  try {
    const item = await prisma.punchItem.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
    
    await prisma.punchItemHistory.create({
      data: { punch_item_id: id, user_id: userId, action: 'REJECTED', comment }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const replyToReject = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { comment } = req.body;
  const userId = req.user?.id;
  
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!comment) return res.status(400).json({ message: 'Comment is mandatory for reply' });

  try {
    await prisma.punchItemHistory.create({
      data: { punch_item_id: id, user_id: userId, action: 'REPLIED', comment }
    });
    res.json({ message: 'Replied successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const cancelItem = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const item = await prisma.punchItem.update({
      where: { id },
      data: { status: 'CANCELED' }
    });
    
    await prisma.punchItemHistory.create({
      data: { punch_item_id: id, user_id: userId, action: 'CANCELED' }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
