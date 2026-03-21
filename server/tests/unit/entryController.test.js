import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/models/Entry.js');

import Entry from '../../src/models/Entry.js';
import {
  getEntries,
  createEntry,
  deleteEntry,
  searchEntries,
} from '../../src/controllers/entryController.js';

// ── helpers ──────────────────────────────────────────────────────────────────

const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

/** Returns a chainable query mock that resolves with `result`. */
const makeQuery = (result) => {
  const q = {};
  q.sort = vi.fn().mockReturnThis();
  q.populate = vi.fn().mockResolvedValue(result);
  return q;
};

const USER_ID = 'user-abc';
const ENTRY_ID = 'entry-xyz';

const makeEntry = (overrides = {}) => ({
  _id: ENTRY_ID,
  title: 'Lisbon trip',
  location: 'Lisbon',
  date: new Date('2024-06-01'),
  body: 'What a city',
  images: [],
  author: { toString: () => USER_ID },
  deleteOne: vi.fn().mockResolvedValue({}),
  ...overrides,
});

// ── getEntries ────────────────────────────────────────────────────────────────

describe('entryController.getEntries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('queries only entries belonging to the authenticated user', async () => {
    const entries = [makeEntry()];
    Entry.find.mockReturnValue(makeQuery(entries));

    const req = { user: { _id: USER_ID } };
    await getEntries(req, makeRes());

    expect(Entry.find).toHaveBeenCalledWith({ author: USER_ID });
  });

  it('calls .populate("author", "name profilePic") to populate author field', async () => {
    const entries = [makeEntry()];
    const query = makeQuery(entries);
    Entry.find.mockReturnValue(query);

    const req = { user: { _id: USER_ID } };
    await getEntries(req, makeRes());

    expect(query.populate).toHaveBeenCalledWith('author', 'name profilePic');
  });

  it('responds with the array of populated entries', async () => {
    const entries = [makeEntry(), makeEntry({ _id: 'entry-2' })];
    Entry.find.mockReturnValue(makeQuery(entries));

    const req = { user: { _id: USER_ID } };
    const res = makeRes();
    await getEntries(req, res);

    expect(res.json).toHaveBeenCalledWith(entries);
  });

  it('sorts entries by date descending', async () => {
    const query = makeQuery([]);
    Entry.find.mockReturnValue(query);

    await getEntries({ user: { _id: USER_ID } }, makeRes());

    expect(query.sort).toHaveBeenCalledWith({ date: -1 });
  });
});

// ── createEntry ───────────────────────────────────────────────────────────────

describe('entryController.createEntry', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 201 with the created entry', async () => {
    const entry = makeEntry();
    Entry.create.mockResolvedValue(entry);

    const req = {
      user: { _id: USER_ID },
      body: { title: 'Lisbon trip', location: 'Lisbon', date: '2024-06-01', body: 'Great' },
      files: [],
    };
    const res = makeRes();
    await createEntry(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(entry);
  });

  it('maps req.files (Cloudinary uploads) to images array', async () => {
    const entry = makeEntry();
    Entry.create.mockResolvedValue(entry);

    const req = {
      user: { _id: USER_ID },
      body: { title: 'Lisbon trip', location: 'Lisbon', date: '2024-06-01', body: 'Great' },
      files: [
        { path: 'https://res.cloudinary.com/demo/image/upload/a.jpg' },
        { path: 'https://res.cloudinary.com/demo/image/upload/b.jpg' },
      ],
    };
    await createEntry(req, makeRes());

    expect(Entry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [
          { url: 'https://res.cloudinary.com/demo/image/upload/a.jpg', caption: '', altText: '' },
          { url: 'https://res.cloudinary.com/demo/image/upload/b.jpg', caption: '', altText: '' },
        ],
      }),
    );
  });

  it('creates entry with empty images array when no files uploaded', async () => {
    Entry.create.mockResolvedValue(makeEntry());

    const req = {
      user: { _id: USER_ID },
      body: { title: 'Lisbon trip', location: 'Lisbon', date: '2024-06-01', body: 'Great' },
      files: undefined,
    };
    await createEntry(req, makeRes());

    expect(Entry.create).toHaveBeenCalledWith(
      expect.objectContaining({ images: [] }),
    );
  });

  it('returns 400 when required fields are missing', async () => {
    const req = {
      user: { _id: USER_ID },
      body: { title: 'Lisbon trip' }, // missing location, date, body
      files: [],
    };
    const res = makeRes();
    await createEntry(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('sets author to authenticated user id', async () => {
    Entry.create.mockResolvedValue(makeEntry());

    const req = {
      user: { _id: USER_ID },
      body: { title: 'T', location: 'L', date: '2024-01-01', body: 'B' },
      files: [],
    };
    await createEntry(req, makeRes());

    expect(Entry.create).toHaveBeenCalledWith(
      expect.objectContaining({ author: USER_ID }),
    );
  });
});

// ── deleteEntry ───────────────────────────────────────────────────────────────

describe('entryController.deleteEntry', () => {
  beforeEach(() => vi.clearAllMocks());

  it('author can delete their own entry', async () => {
    const entry = makeEntry({ author: { toString: () => USER_ID } });
    Entry.findById.mockResolvedValue(entry);

    const req = { user: { _id: USER_ID, toString: () => USER_ID }, params: { id: ENTRY_ID } };
    const res = makeRes();
    await deleteEntry(req, res);

    expect(entry.deleteOne).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  it('returns 403 when authenticated user is not the author', async () => {
    const entry = makeEntry({ author: { toString: () => 'other-user' } });
    Entry.findById.mockResolvedValue(entry);

    const req = { user: { _id: USER_ID, toString: () => USER_ID }, params: { id: ENTRY_ID } };
    const res = makeRes();
    await deleteEntry(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(entry.deleteOne).not.toHaveBeenCalled();
  });

  it('returns 404 when entry does not exist', async () => {
    Entry.findById.mockResolvedValue(null);

    const req = { user: { _id: USER_ID }, params: { id: 'nonexistent' } };
    const res = makeRes();
    await deleteEntry(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ── searchEntries ─────────────────────────────────────────────────────────────

describe('entryController.searchEntries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('applies $text search with the q parameter', async () => {
    const entries = [makeEntry()];
    Entry.find.mockReturnValue(makeQuery(entries));

    const req = { user: { _id: USER_ID }, query: { q: 'Lisbon' } };
    await searchEntries(req, makeRes());

    expect(Entry.find).toHaveBeenCalledWith(
      expect.objectContaining({ $text: { $search: 'Lisbon' } }),
    );
  });

  it('filters by authenticated user (author field in query)', async () => {
    Entry.find.mockReturnValue(makeQuery([]));

    const req = { user: { _id: USER_ID }, query: { q: 'beach' } };
    await searchEntries(req, makeRes());

    expect(Entry.find).toHaveBeenCalledWith(
      expect.objectContaining({ author: USER_ID }),
    );
  });

  it('sorts results by textScore', async () => {
    const query = makeQuery([]);
    Entry.find.mockReturnValue(query);

    const req = { user: { _id: USER_ID }, query: { q: 'beach' } };
    await searchEntries(req, makeRes());

    expect(query.sort).toHaveBeenCalledWith({ score: { $meta: 'textScore' } });
  });

  it('returns 400 when q parameter is missing', async () => {
    const req = { user: { _id: USER_ID }, query: {} };
    const res = makeRes();

    await searchEntries(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('responds with the matching entries', async () => {
    const entries = [makeEntry()];
    Entry.find.mockReturnValue(makeQuery(entries));

    const req = { user: { _id: USER_ID }, query: { q: 'Lisbon' } };
    const res = makeRes();
    await searchEntries(req, res);

    expect(res.json).toHaveBeenCalledWith(entries);
  });
});
