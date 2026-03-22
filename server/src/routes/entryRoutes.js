import { Router } from 'express';
import { getEntries, createEntry, updateEntry, deleteEntry, searchEntries } from '../controllers/entryController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, _file) => ({
    folder:          'travel-journal',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  }),
});

const upload = multer({ storage });

const router = Router();

router.use(protect);

router.get('/',        getEntries);
router.post('/',       upload.array('images', 10), createEntry);
router.put('/:id',     upload.array('images', 10), updateEntry);
router.delete('/:id',  deleteEntry);
router.get('/search',  searchEntries);

export default router;
