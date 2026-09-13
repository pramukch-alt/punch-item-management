import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireRole } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();
router.use(authenticateToken, requireRole(['SUPERADMIN']));

router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        package: true,
        users: {
          where: { role: 'ADMIN' },
          select: { id: true, email: true, name: true, created_at: true }
        },
        _count: {
          select: { punch_items: true, users: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error });
  }
});

router.post('/', async (req, res) => {
  const {
    name,
    package_id,
    customer_name,
    customer_info,
    admin_name,
    admin_contact,
    duration_months,
    start_date,
    end_date,
    status,
    admin_email,
    admin_password
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Project name is required' });
  }

  try {
    // If admin_email is provided, check uniqueness beforehand
    if (admin_email && admin_email.trim()) {
      const existingUser = await prisma.user.findUnique({
        where: { email: admin_email.trim().toLowerCase() }
      });
      if (existingUser) {
        return res.status(400).json({ message: `Email "${admin_email.trim()}" is already in use by another user.` });
      }
    }

    let calculatedStartDate = start_date ? new Date(start_date) : new Date();
    let calculatedEndDate = end_date ? new Date(end_date) : null;
    const months = duration_months ? parseInt(duration_months) : null;

    if (!calculatedEndDate && months) {
      calculatedEndDate = new Date(calculatedStartDate);
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + months);
    }

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name: name.trim(),
          package_id: package_id || null,
          customer_name: customer_name?.trim() || null,
          customer_info: customer_info?.trim() || null,
          admin_name: admin_name?.trim() || null,
          admin_contact: admin_contact?.trim() || null,
          duration_months: months,
          start_date: calculatedStartDate,
          end_date: calculatedEndDate,
          status: status || 'ACTIVE'
        },
        include: { package: true }
      });

      let adminUser = null;
      if (admin_email && admin_email.trim() && admin_password && admin_password.trim()) {
        const password_hash = await bcrypt.hash(admin_password.trim(), 10);
        adminUser = await tx.user.create({
          data: {
            email: admin_email.trim().toLowerCase(),
            password_hash,
            name: admin_name?.trim() || `${project.name} Administrator`,
            role: 'ADMIN',
            project_id: project.id
          }
        });
      }

      return { project, adminUser };
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message || error });
  }
});

router.put('/:id', async (req, res) => {
  const {
    name,
    package_id,
    customer_name,
    customer_info,
    admin_name,
    admin_contact,
    duration_months,
    start_date,
    end_date,
    status,
    admin_email,
    admin_password
  } = req.body;

  try {
    let calculatedStartDate = start_date ? new Date(start_date) : undefined;
    let calculatedEndDate = end_date ? new Date(end_date) : undefined;
    const months = duration_months !== undefined ? (duration_months ? parseInt(duration_months) : null) : undefined;

    if (calculatedEndDate === undefined && months && calculatedStartDate) {
      calculatedEndDate = new Date(calculatedStartDate);
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + months);
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(package_id !== undefined && { package_id: package_id || null }),
        ...(customer_name !== undefined && { customer_name: customer_name?.trim() || null }),
        ...(customer_info !== undefined && { customer_info: customer_info?.trim() || null }),
        ...(admin_name !== undefined && { admin_name: admin_name?.trim() || null }),
        ...(admin_contact !== undefined && { admin_contact: admin_contact?.trim() || null }),
        ...(duration_months !== undefined && { duration_months: months }),
        ...(calculatedStartDate && { start_date: calculatedStartDate }),
        ...(calculatedEndDate !== undefined && { end_date: calculatedEndDate }),
        ...(status && { status })
      },
      include: { package: true }
    });

    // If new admin or admin password update requested
    if (admin_password && admin_password.trim()) {
      const password_hash = await bcrypt.hash(admin_password.trim(), 10);
      const existingAdmin = await prisma.user.findFirst({
        where: { project_id: req.params.id, role: 'ADMIN' }
      });

      if (existingAdmin) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: {
            password_hash,
            ...(admin_name && { name: admin_name.trim() })
          }
        });
      } else if (admin_email && admin_email.trim()) {
        await prisma.user.create({
          data: {
            email: admin_email.trim().toLowerCase(),
            password_hash,
            name: admin_name?.trim() || `${project.name} Administrator`,
            role: 'ADMIN',
            project_id: project.id
          }
        });
      }
    }

    res.json(project);
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project', error: error.message || error });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    // Delete relations or check if any
    await prisma.punchItemHistory.deleteMany({
      where: { punch_item: { project_id: req.params.id } }
    });
    await prisma.punchItem.deleteMany({
      where: { project_id: req.params.id }
    });
    await prisma.user.deleteMany({
      where: { project_id: req.params.id }
    });
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project and all associated data deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error });
  }
});

export default router;
