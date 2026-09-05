import { Router } from 'express';
import { getPunchItems, getPunchItemById, createPunchItem, updatePunchItem } from '../controllers/punchItemController';
import { submitToOE, submitToOwner, closeItem, rejectItem, cancelItem, replyToReject } from '../controllers/workflowController';
import { importExcel, bulkImageUpload } from '../controllers/importController';
import { authenticateToken, requireRole } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const imagesDir = path.join(__dirname, '../../uploads/punch-items');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const memoryUpload = multer({ storage: multer.memoryStorage() }); // for excel

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'punch-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const imageUpload = multer({ 
  storage: diskStorage,
  limits: { fileSize: 1 * 1024 * 1024 } // 1MB backend limit
});

const router = Router();

// Apply auth middleware to all routes in this file
router.use(authenticateToken);

router.get('/', getPunchItems);
router.get('/:id', getPunchItemById);
router.post('/', requireRole(['CONTRACTOR', 'ADMIN']), imageUpload.fields([{ name: 'before_image', maxCount: 1 }, { name: 'before_image_2', maxCount: 1 }, { name: 'after_image', maxCount: 1 }, { name: 'after_image_2', maxCount: 1 }]), createPunchItem);
router.put('/:id', requireRole(['CONTRACTOR']), imageUpload.fields([{ name: 'before_image', maxCount: 1 }, { name: 'before_image_2', maxCount: 1 }, { name: 'after_image', maxCount: 1 }, { name: 'after_image_2', maxCount: 1 }]), updatePunchItem);
router.post('/import', requireRole(['CONTRACTOR', 'ADMIN', 'SUPERVISOR']), memoryUpload.single('file'), importExcel);
router.post('/bulk-images', requireRole(['CONTRACTOR', 'ADMIN', 'SUPERVISOR']), imageUpload.array('images', 50), bulkImageUpload);
// Workflow routes
router.post('/:id/submit-oe', requireRole(['CONTRACTOR', 'ADMIN']), submitToOE);
router.post('/:id/submit-owner', requireRole(['OE', 'ADMIN']), submitToOwner);
router.post('/:id/close', requireRole(['OWNER', 'ADMIN']), closeItem);
router.post('/:id/reject', requireRole(['OE', 'OWNER', 'ADMIN']), rejectItem);
router.post('/:id/cancel', requireRole(['CONTRACTOR', 'ADMIN']), cancelItem);
router.post('/:id/reply', requireRole(['CONTRACTOR', 'ADMIN']), replyToReject);

export default router;
