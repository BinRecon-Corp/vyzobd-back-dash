import { Router } from 'express';
import * as Controller from '../controllers/seo.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';

const router = Router();
router.use(requireAuth);

router.get('/', Controller.getGlobalSeo);
router.put('/', Controller.updateGlobalSeo);

export default router;
