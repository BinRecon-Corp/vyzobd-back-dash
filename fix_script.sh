#!/bin/bash
write_controller() {
  local MODEL_NAME=$1
  local FILE_PATH=$2
  
  cat << CONTROLLER > $FILE_PATH
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.${MODEL_NAME}.findMany();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const item = await prisma.${MODEL_NAME}.findUnique({ where: { id } });
    if (!item) throw new AppError('${MODEL_NAME} not found', 404);
    res.json(item);
  } catch (error) {
    next(error);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newItem = await prisma.${MODEL_NAME}.create({ data: req.body });
    res.status(201).json(newItem);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updated = await prisma.${MODEL_NAME}.update({ where: { id }, data: req.body });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await prisma.${MODEL_NAME}.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
CONTROLLER
}

# Helper to write route template
write_route() {
  local FILE_PATH=$1
  local CONTROLLER_NAME=\$(basename \$FILE_PATH .routes.ts)
  
  cat << ROUTE > \$FILE_PATH
import { Router } from 'express';
import * as Controller from '../controllers/\${CONTROLLER_NAME}.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware
router.use(requireAuth);

router.get('/', Controller.getAll);
router.get('/:id', Controller.getById);
router.post('/', Controller.create);
router.put('/:id', Controller.update);
router.delete('/:id', Controller.remove);

export default router;
ROUTE
}

write_controller "page" src/backend/controllers/page.controller.ts
write_route src/backend/routes/page.routes.ts

write_controller "landingPage" src/backend/controllers/landing-page.controller.ts
write_route src/backend/routes/landing-page.routes.ts

write_controller "blogPost" src/backend/controllers/blog.controller.ts
write_route src/backend/routes/blog.routes.ts

write_controller "mediaAsset" src/backend/controllers/media.controller.ts
write_route src/backend/routes/media.routes.ts

write_controller "fAQ" src/backend/controllers/faq.controller.ts
write_route src/backend/routes/faq.routes.ts
