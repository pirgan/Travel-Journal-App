import Entry from '../models/Entry.js';

// GET /api/entries
// Fetch every journal entry that belongs to the authenticated user.
// Results are sorted newest-first; author name and profile pic are joined from the User collection.
export const getEntries = async (req, res) => {
  const entries = await Entry.find({ author: req.user._id })
    .sort({ date: -1 })
    .populate('author', 'name profilePic');  // replace the author ObjectId with actual user fields
  res.json(entries);
};

// POST /api/entries
// Create a new entry document in MongoDB.
// By the time this runs, multer has already uploaded any attached files to Cloudinary
// and placed their metadata on req.files.
export const createEntry = async (req, res) => {
  const { title, location, date, body } = req.body;

  // Validate required text fields before touching the database
  if (!title || !location || !date || !body) {
    return res.status(400).json({ message: 'title, location, date and body are required' });
  }

  // Map each Cloudinary upload result to the image sub-document shape used by the Entry schema.
  // f.path is the Cloudinary URL returned by multer-storage-cloudinary.
  const images = (req.files ?? []).map((f) => ({
    url:     f.path,
    caption: '',
    altText: '',
  }));

  // Persist the new entry; author is taken from the JWT-authenticated user on req.user
  const entry = await Entry.create({
    title,
    location,
    date,
    body,
    images,
    author: req.user._id,
  });

  res.status(201).json(entry);
};

// PUT /api/entries/:id
// Update an existing entry. Only the original author may do this.
// New images uploaded in this request are appended to the existing image array.
export const updateEntry = async (req, res) => {
  // Look up the entry by the :id URL parameter
  const entry = await Entry.findById(req.params.id);

  if (!entry) {
    return res.status(404).json({ message: 'Entry not found' });
  }

  // Ownership check: compare the entry's author ObjectId against the authenticated user's id
  if (entry.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorised to edit this entry' });
  }

  // Apply only the fields that were actually sent — partial updates are allowed
  const { title, location, date, body } = req.body;
  if (title)    entry.title    = title;
  if (location) entry.location = location;
  if (date)     entry.date     = date;
  if (body)     entry.body     = body;

  // Convert any newly uploaded Cloudinary files to image sub-documents and append them
  const newImages = (req.files ?? []).map((f) => ({ url: f.path, caption: '', altText: '' }));
  if (newImages.length) entry.images = [...entry.images, ...newImages];

  const updated = await entry.save();
  res.json(updated);
};

// DELETE /api/entries/:id
// Permanently remove an entry. Only the original author may do this.
export const deleteEntry = async (req, res) => {
  // Fetch the entry by id so we can verify ownership before deleting
  const entry = await Entry.findById(req.params.id);

  if (!entry) {
    return res.status(404).json({ message: 'Entry not found' });
  }

  // Ownership check: prevent one user from deleting another user's entries
  if (entry.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorised to delete this entry' });
  }

  await entry.deleteOne();
  res.json({ message: 'Entry deleted' });
};

// GET /api/entries/search?q=<query>
// Full-text search across the user's entries using MongoDB's $text index.
// Results are ranked by relevance score descending.
export const searchEntries = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Query parameter q is required' });
  }

  const entries = await Entry.find({
    author: req.user._id,  // scope results to the authenticated user only
    $text:  { $search: q }, // MongoDB full-text search against indexed fields
  })
    .sort({ score: { $meta: 'textScore' } })  // rank by how closely each doc matches the query
    .populate('author', 'name profilePic');

  res.json(entries);
};
