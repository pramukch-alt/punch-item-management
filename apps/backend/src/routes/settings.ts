import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Publicly readable so the layout can fetch project name on load
router.get('/', authenticateToken, getSettings);

// Only Admin can update settings
router.put('/', authenticateToken, requireRole(['ADMIN']), updateSettings);

// Test email route
import { testEmail } from '../controllers/settingsController';
router.post('/test-email', authenticateToken, requireRole(['ADMIN']), testEmail);

export default router;
