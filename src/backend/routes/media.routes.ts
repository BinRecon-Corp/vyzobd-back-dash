import { Router } from 'express';
import multer from 'multer';
import { MediaController } from '../controllers/media.controller';
import { requireAuth, requirePermission } from '../middlewares/auth';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`Disallowed file type (${file.mimetype}). Allowed types: JPG, PNG, WEBP, SVG`));
    }
  },
});

// Protect all media endpoints with authentication
router.use(requireAuth);

// GET /api/v1/media - List all assets (Media.Read)
router.get('/', requirePermission('Media', 'Read'), MediaController.listAssets);

// POST /api/v1/media/upload - Single file upload (Media.Write)
router.post('/upload', requirePermission('Media', 'Write'), upload.single('file'), MediaController.uploadSingle);

// POST /api/v1/media/upload-multiple - Multiple files upload (Media.Write)
router.post('/upload-multiple', requirePermission('Media', 'Write'), upload.array('files', 10), MediaController.uploadMultiple);

// PUT /api/v1/media/:id - Replace asset (Media.Write)
router.put('/:id', requirePermission('Media', 'Write'), upload.single('file'), MediaController.replaceAsset);

// DELETE /api/v1/media/:id - Delete asset (Media.Delete)
router.delete('/:id', requirePermission('Media', 'Delete'), MediaController.deleteAsset);

// Product-specific gallery management endpoints
router.put('/products/:productId/primary/:imageId', requirePermission('Media', 'Write'), MediaController.setPrimaryProductImage);
router.put('/products/:productId/reorder', requirePermission('Media', 'Write'), MediaController.reorderGalleryImages);

export default router;
