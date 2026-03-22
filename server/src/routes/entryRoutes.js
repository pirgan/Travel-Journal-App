import { Router } from 'express';
import { getEntries, createEntry, updateEntry, deleteEntry, searchEntries } from '../controllers/entryController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Configure Cloudinary as the multer storage backend.
// Each uploaded file is streamed directly to Cloudinary — nothing is saved to disk.
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, _file) => ({
    folder:          'travel-journal',   // Cloudinary folder all entry images go into
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],  // reject other file types at upload time
  }),
});

// multer middleware that uses the Cloudinary storage above.
// upload.array('images', 20) means: accept a multi-file field named 'images', max 20 files per request.
const upload = multer({ storage });

const router = Router();

// Apply JWT authentication to every route in this file.
// Any request without a valid token gets a 401 before reaching the controller.
router.use(protect);

router.get('/',        getEntries);                          // fetch all entries for the logged-in user
router.post('/',       upload.array('images', 20), createEntry);  // upload images to Cloudinary, then create entry
router.put('/:id',     upload.array('images', 20), updateEntry);  // upload new images, then patch existing entry
router.delete('/:id',  deleteEntry);                         // remove entry document from MongoDB
router.get('/search',  searchEntries);                       // full-text search across the user's entries

export default router;
