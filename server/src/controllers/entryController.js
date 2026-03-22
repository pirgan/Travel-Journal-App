import Entry from '../models/Entry.js';

export const getEntries = async (req, res) => {
  const entries = await Entry.find({ author: req.user._id })
    .sort({ date: -1 })
    .populate('author', 'name profilePic');
  res.json(entries);
};

export const createEntry = async (req, res) => {
  const { title, location, date, body } = req.body;

  if (!title || !location || !date || !body) {
    return res.status(400).json({ message: 'title, location, date and body are required' });
  }

  const images = (req.files ?? []).map((f) => ({
    url:     f.path,
    caption: '',
    altText: '',
  }));

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

export const updateEntry = async (req, res) => {
  const entry = await Entry.findById(req.params.id);

  if (!entry) {
    return res.status(404).json({ message: 'Entry not found' });
  }

  if (entry.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorised to edit this entry' });
  }

  const { title, location, date, body } = req.body;
  if (title)    entry.title    = title;
  if (location) entry.location = location;
  if (date)     entry.date     = date;
  if (body)     entry.body     = body;

  const newImages = (req.files ?? []).map((f) => ({ url: f.path, caption: '', altText: '' }));
  if (newImages.length) entry.images = [...entry.images, ...newImages];

  const updated = await entry.save();
  res.json(updated);
};

export const deleteEntry = async (req, res) => {
  const entry = await Entry.findById(req.params.id);

  if (!entry) {
    return res.status(404).json({ message: 'Entry not found' });
  }

  if (entry.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorised to delete this entry' });
  }

  await entry.deleteOne();
  res.json({ message: 'Entry deleted' });
};

export const searchEntries = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Query parameter q is required' });
  }

  const entries = await Entry.find({
    author: req.user._id,
    $text:  { $search: q },
  })
    .sort({ score: { $meta: 'textScore' } })
    .populate('author', 'name profilePic');

  res.json(entries);
};
