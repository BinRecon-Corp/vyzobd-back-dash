#!/bin/bash
mkdir -p src/backend/controllers src/backend/routes

# Helper to write basic CRUD controller template
write_controller() {
  local MODEL_NAME=$1
  local FILE_PATH=$2
  
  cat << 'CONTROLLER' > $FILE_PATH
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
  
  cat << 'ROUTE' > $FILE_PATH
import { Router } from 'express';
import * as Controller from '../controllers/'$(basename $FILE_PATH .routes.ts)'.controller';
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

# Generate files
write_controller "page" src/backend/controllers/page.controller.ts
write_route src/backend/routes/page.routes.ts
sed -i 's/page.controller/page.controller/g' src/backend/routes/page.routes.ts

write_controller "landingPage" src/backend/controllers/landing-page.controller.ts
write_route src/backend/routes/landing-page.routes.ts
sed -i 's/landing-page.controller/landing-page.controller/g' src/backend/routes/landing-page.routes.ts

write_controller "blogPost" src/backend/controllers/blog.controller.ts
write_route src/backend/routes/blog.routes.ts

write_controller "mediaAsset" src/backend/controllers/media.controller.ts
write_route src/backend/routes/media.routes.ts

write_controller "fAQ" src/backend/controllers/faq.controller.ts
write_route src/backend/routes/faq.routes.ts

# Special SEO controller
cat << 'CONTROLLER' > src/backend/controllers/seo.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getGlobalSeo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.globalSeoSettings.findFirst();
    res.json(settings || {});
  } catch (error) {
    next(error);
  }
};

export const updateGlobalSeo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.globalSeoSettings.findFirst();
    let updated;
    if (existing) {
      updated = await prisma.globalSeoSettings.update({ where: { id: existing.id }, data: req.body });
    } else {
      updated = await prisma.globalSeoSettings.create({ data: req.body });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
CONTROLLER

cat << 'ROUTE' > src/backend/routes/seo.routes.ts
import { Router } from 'express';
import * as Controller from '../controllers/seo.controller';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', Controller.getGlobalSeo);
router.put('/', Controller.updateGlobalSeo);

export default router;
ROUTE

chmod +x generate_cms_apis.sh
