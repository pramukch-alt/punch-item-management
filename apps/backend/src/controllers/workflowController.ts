import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';

type GuardResult =
  | { ok: true; item: any; dbUser: any }
  | { ok: false; status: number; message: string };

/**
 * Shared guard for workflow actions:
 * - Verifies the item exists
 * - Ensures the item belongs to the caller's project (SUPERADMIN bypasses)
 * - Ensures the current item status allows the requested transition
 */
const guardWorkflowAction = async (
  req: AuthRequest,
  allowedFromStatuses: string[] | null
): Promise<GuardResult> => {
  const id = req.params.id as string;
  const userId = req.user?.id;
  if (!userId) return { ok: false, status: 401, message: 'Unauthorized' };

  const [item, dbUser] = await Promise.all([
    prisma.punchItem.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  if (!dbUser) return { ok: false, status: 401, message: 'Unauthorized' };
  if (!item) return { ok: false, status: 404, message: 'Punch item not found' };

  if (req.user?.role !== 'SUPERADMIN') {
    const userProjectId = (dbUser as any).project_id || null;
    const itemProjectId = (item as any).project_id || null;
    if (itemProjectId && itemProjectId !== userProjectId) {
      return { ok: false, status: 403, message: 'Forbidden: Item belongs to another project' };
    }
  }

  if (allowedFromStatuses && !allowedFromStatuses.includes(item.status)) {
    return {
      ok: false,
      status: 400,
      message: `Action not allowed while item status is ${item.status.replace(/_/g, ' ')}`,
    };
  }

  return { ok: true, item, dbUser };
};

export const submitToOE = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const guard = await guardWorkflowAction(req, ['OPEN', 'REJECTED']);
    if (!guard.ok) return res.status(guard.status).json({ message: guard.message });

    const item = await prisma.punchItem.update({
      where: { id },
      data: { status: 'SUBMIT_TO_OE' }
    });

    await prisma.punchItemHistory.create({
      data: { punch_item_id: id, user_id: guard.dbUser.id, action: 'SUBMITTED_TO_OE' }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const submitToOwner = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const guard = await guardWorkflowAction(req, ['SUBMIT_TO_OE']);
    if (!guard.ok) return res.status(guard.status).json({ message: guard.message });

    const item = await prisma.punchItem.update({
      where: { id },
      data: { status: 'SUBMIT_TO_OWNER' }
    });

    await prisma.punchItemHistory.create({
      data: {
        punch_item_id: id,
        user_id: guard.dbUser.id,
        action: 'SUBMITTED_TO_OWNER',
        signature_snapshot_path: guard.dbUser.signature_image_path
      }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const closeItem = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const guard = await guardWorkflowAction(req, ['SUBMIT_TO_OWNER']);
    if (!guard.ok) return res.status(guard.status).json({ message: guard.message });

    const item = await prisma.punchItem.update({
      where: { id },
      data: { status: 'CLOSED' }
    });

    await prisma.punchItemHistory.create({
      data: {
        punch_item_id: id,
        user_id: guard.dbUser.id,
        action: 'APPROVED',
        signature_snapshot_path: guard.dbUser.signature_image_path
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
  if (!comment) return res.status(400).json({ message: 'Comment is mandatory for rejection' });

  try {
    const guard = await guardWorkflowAction(req, ['SUBMIT_TO_OE', 'SUBMIT_TO_OWNER']);
    if (!guard.ok) return res.status(guard.status).json({ message: guard.message });

    const item = await prisma.punchItem.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    await prisma.punchItemHistory.create({
      data: { punch_item_id: id, user_id: guard.dbUser.id, action: 'REJECTED', comment }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const replyToReject = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ message: 'Comment is mandatory for reply' });

  try {
    const guard = await guardWorkflowAction(req, null);
    if (!guard.ok) return res.status(guard.status).json({ message: guard.message });

    await prisma.punchItemHistory.create({
      data: { punch_item_id: id, user_id: guard.dbUser.id, action: 'REPLIED', comment }
    });
    res.json({ message: 'Replied successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const cancelItem = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const guard = await guardWorkflowAction(req, ['OPEN', 'REJECTED', 'SUBMIT_TO_OE', 'SUBMIT_TO_OWNER']);
    if (!guard.ok) return res.status(guard.status).json({ message: guard.message });

    const item = await prisma.punchItem.update({
      where: { id },
      data: { status: 'CANCELED' }
    });

    await prisma.punchItemHistory.create({
      data: { punch_item_id: id, user_id: guard.dbUser.id, action: 'CANCELED' }
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};
