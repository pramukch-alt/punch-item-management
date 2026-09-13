import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticateToken, requireRole(['SUPERADMIN']));

// Get all packages
router.get('/', async (req, res) => {
  try {
    const packages = await prisma.package.findMany();
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching packages', error });
  }
});

// Create package
router.post('/', async (req, res) => {
  try {
    const pkg = await prisma.package.create({ data: req.body });
    res.status(201).json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Error creating package', error });
  }
});

// Update package
router.put('/:id', async (req, res) => {
  try {
    const pkg = await prisma.package.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(pkg);
  } catch (error) {
    res.status(500).json({ message: 'Error updating package', error });
  }
});

// Delete package
router.delete('/:id', async (req, res) => {
  try {
    await prisma.package.delete({ where: { id: req.params.id } });
    res.json({ message: 'Package deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting package', error });
  }
});

export default router;
