import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import * as xlsx from 'xlsx';
import { Discipline } from '@prisma/client';
import fs from 'fs';

export const importExcel = async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let importedCount = 0;
    let updatedCount = 0;

    for (const row of data as any[]) {
      let { running_no, discipline, description, category, kks_tag, package: pkg, system } = row;
      
      if (!discipline || !description) continue;
      
      // Auto-assign category if not present
      if (!category) category = 'C';

      await prisma.$transaction(async (tx) => {
        let existing = null;
        if (running_no) {
          existing = await tx.punchItem.findUnique({ where: { running_no } });
        }
        
        if (existing) {
          await tx.punchItem.update({
            where: { running_no },
            data: { 
              description, 
              discipline: discipline as Discipline,
              category: category as any,
              kks_tag: kks_tag || null,
              package: pkg || null,
              system: system || null,
              updated_at: new Date() 
            }
          });
          
          await tx.punchItemHistory.create({
            data: { punch_item_id: existing.id, user_id: userId, action: 'UPDATED', comment: 'Bulk Excel Update' }
          });
          updatedCount++;
        } else {
          // Generate new running_no
          const year = new Date().getFullYear().toString();
          const lastItem = await tx.punchItem.findFirst({
            where: {
              discipline: discipline as Discipline,
              running_no: { startsWith: `${discipline}-${year}-` }
            },
            orderBy: { running_no: 'desc' }
          });

          let nextNumber = 1;
          if (lastItem) {
            const parts = lastItem.running_no.split('-');
            nextNumber = parseInt(parts[2], 10) + 1;
          }

          const paddedNumber = nextNumber.toString().padStart(4, '0');
          running_no = `${discipline}-${year}-${paddedNumber}`;

          const newItem = await tx.punchItem.create({
            data: {
              running_no,
              discipline: discipline as Discipline,
              category: category as any,
              kks_tag: kks_tag || null,
              package: pkg || null,
              system: system || null,
              description,
              status: 'OPEN',
              created_by_id: userId
            }
          });
          
          await tx.punchItemHistory.create({
            data: { punch_item_id: newItem.id, user_id: userId, action: 'CREATED', comment: 'Bulk Excel Import' }
          });
          importedCount++;
        }
      });
    }

    res.json({ message: 'Import successful', importedCount, updatedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error processing Excel file', error });
  }
};
export const bulkImageUpload = async (req: AuthRequest, res: Response) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({ message: 'No images uploaded' });
  }

  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const pattern = /^([A-Za-z0-9]+-\d+-\d+)_(before|after)_(1|2)(?:\.[a-zA-Z0-9]+)?$/i;
  let successCount = 0;
  const errors: string[] = [];

  for (const file of req.files) {
    const match = file.originalname.match(pattern);
    if (!match) {
      errors.push(`Invalid filename format: ${file.originalname}`);
      fs.unlinkSync(file.path);
      continue;
    }

    const running_no = match[1].toUpperCase();
    const type = match[2].toLowerCase(); // 'before' | 'after'
    const index = match[3]; // '1' | '2'

    const targetField = type === 'before' 
      ? (index === '1' ? 'before_image_path' : 'before_image_2_path')
      : (index === '1' ? 'after_image_path' : 'after_image_2_path');

    try {
      const punchItem = await prisma.punchItem.findUnique({ where: { running_no } });
      if (!punchItem) {
        errors.push(`Punch Item not found for: ${file.originalname}`);
        fs.unlinkSync(file.path);
        continue;
      }

      await prisma.punchItem.update({
        where: { id: punchItem.id },
        data: { [targetField]: `/uploads/punch-items/${file.filename}` }
      });

      await prisma.punchItemHistory.create({
        data: { punch_item_id: punchItem.id, user_id: userId, action: 'UPDATED', comment: `Bulk Image Upload: ${type} ${index}` }
      });
      successCount++;
    } catch (err) {
      errors.push(`Error processing ${file.originalname}`);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
  }

  res.json({ message: `Successfully uploaded ${successCount} images.`, errors });
};
