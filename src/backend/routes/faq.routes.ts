import { Router } from 'express';
import * as Controller from '../controllers/faq.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';

const router = Router();

// Apply auth middleware
router.use(requireAuth);

router.get('/', Controller.getAll);
router.get('/:id', Controller.getById);
router.post('/', Controller.create);
router.put('/:id', Controller.update);
router.delete('/:id', Controller.remove);

export default router;
