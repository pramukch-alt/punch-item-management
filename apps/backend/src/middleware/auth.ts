import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: string;
    project_id?: string | null;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(401).json({ message: 'Token expired or invalid', code: 'TOKEN_EXPIRED' });
    req.user = user;
    next();
  });
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

import prisma from '../utils/prisma';

export const checkPackageLimits = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  
  // Superadmin bypasses package limits
  if (req.user.role === 'SUPERADMIN') return next();

  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
      include: { project: { include: { package: true } } }
    });

    if (!user?.project?.package) {
      // If no project/package assigned, maybe allow or reject based on policy? 
      // Let's assume we allow them to proceed as a fallback, or reject.
      // Requirement says "Before allowing... verify". Let's reject if no package.
      return res.status(403).json({ message: 'No active subscription package found for your account.' });
    }

    const pkg = user.project.package;
    if (pkg.max_punch_items !== null) {
      const currentCount = await prisma.punchItem.count({
        where: { project_id: user.project_id }
      });

      if (currentCount >= pkg.max_punch_items) {
        return res.status(403).json({ message: `Package limit reached. Your current plan allows a maximum of ${pkg.max_punch_items} items.` });
      }
    }
    
    // Attach project_id to req.user for downstream use
    req.user.project_id = user.project_id;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking package limits', error });
  }
};

export const checkFeatureAccess = (feature: 'pwa' | 'report') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.role === 'SUPERADMIN') return next();

    try {
      const user = await prisma.user.findUnique({ 
        where: { id: req.user.id },
        include: { project: { include: { package: true } } }
      });

      if (!user?.project?.package) {
        return res.status(403).json({ message: 'No active subscription package found.' });
      }

      const pkg = user.project.package;
      const hasAccess = feature === 'pwa' ? pkg.pwa_enabled : pkg.report_enabled;

      if (!hasAccess) {
        return res.status(403).json({ message: `Feature '${feature}' is not enabled in your current package.` });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: 'Error verifying feature access', error });
    }
  };
};
