import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticateToken, requireRole } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/signatures'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'signature-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const router = Router();

router.use(authenticateToken);
router.use(requireRole(['ADMIN'])); // Only Admin can manage users

router.get('/', getUsers);
router.post('/', upload.single('signature'), createUser);
router.put('/:id', upload.single('signature'), updateUser);
router.delete('/:id', deleteUser);

export default router;
