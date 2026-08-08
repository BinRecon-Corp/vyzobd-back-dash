import { validateBody, validateParamsUUID, createMediaAssetSchema, updateMediaAssetSchema } from '../middlewares/validation';
import { Router } from 'express';
import * as Controller from '../controllers/media.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';

const router = Router();

// Apply auth middleware
router.use(requireAuth);

router.get('/', requirePermission("Media", "read"), Controller.getAll);
router.get('/:id', requirePermission("Media", "read"), validateParamsUUID(["id"]), Controller.getById);
router.post('/', requirePermission("Media", "write"), validateBody(createMediaAssetSchema), Controller.create);
router.put('/:id', requirePermission("Media", "write"), validateParamsUUID(["id"]), validateBody(updateMediaAssetSchema), Controller.update);
router.delete('/:id', requirePermission("Media", "delete"), validateParamsUUID(["id"]), Controller.remove);

export default router;
