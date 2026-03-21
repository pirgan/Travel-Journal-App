import { anthropic } from '../config/anthropic.js';
import Entry from '../models/Entry.js';

// 1. POST /api/ai/enhance-entry  — streaming prose rewrite
export const enhanceEntry = async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ message: 'body is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = anthropic.messages.stream({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages:   [{ role: 'user', content: `Rewrite the following travel journal entry as polished, vivid prose:\n\n${body}` }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      res.write(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
};

// 2. POST /api/ai/location-insights  — JSON retrieval (cached in MongoDB)
export const locationInsights = async (req, res) => {
  const { entryId, location } = req.body;
  if (!location) return res.status(400).json({ message: 'location is required' });

  if (entryId) {
    const entry = await Entry.findById(entryId);
    if (entry?.locationInsights?.etiquette) {
      return res.json(entry.locationInsights);
    }
  }

  const msg = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system:     'Return ONLY valid JSON. No markdown.',
    messages:   [{
      role:    'user',
      content: `Give travel insights for ${location} as JSON with keys: etiquette, phrases (array of 3), currency, season, hiddenGem`,
    }],
  });

  const insights = JSON.parse(msg.content[0].text);

  if (entryId) {
    await Entry.findByIdAndUpdate(entryId, { locationInsights: insights });
  }

  res.json(insights);
};

// 3. POST /api/ai/caption-photo  — vision
export const captionPhoto = async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(400).json({ message: 'imageUrl is required' });

  const msg = await anthropic.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 256,
    system:     'Return ONLY valid JSON. No markdown.',
    messages:   [{
      role:    'user',
      content: [
        { type: 'image', source: { type: 'url', url: imageUrl } },
        { type: 'text',  text:   'Write a short caption and altText for this travel photo. Return JSON: { caption, altText }' },
      ],
    }],
  });

  res.json(JSON.parse(msg.content[0].text));
};

// 4. POST /api/ai/compile-trip  — streaming long-form synthesis
export const compileTrip = async (req, res) => {
  const { entryIds } = req.body;
  if (!Array.isArray(entryIds) || entryIds.length === 0) {
    return res.status(400).json({ message: 'entryIds array is required' });
  }

  const entries = await Entry.find({ _id: { $in: entryIds }, author: req.user._id });
  if (entries.length === 0) return res.status(404).json({ message: 'No entries found' });

  const combined = entries
    .map((e) => `## ${e.title} — ${e.location}\n${e.body}`)
    .join('\n\n');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = anthropic.messages.stream({
    model:      'claude-sonnet-4-6',
    max_tokens: 2048,
    messages:   [{ role: 'user', content: `Compile these travel journal entries into a cohesive trip narrative:\n\n${combined}` }],
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      res.write(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
};

// 5. POST /api/ai/analyse-sentiment  — batch JSON (groups of 5)
export const analyseSentiment = async (req, res) => {
  const { entryIds } = req.body;
  if (!Array.isArray(entryIds) || entryIds.length === 0) {
    return res.status(400).json({ message: 'entryIds array is required' });
  }

  const entries = await Entry.find({ _id: { $in: entryIds }, author: req.user._id });

  const toProcess = entries.filter((e) => !e.sentiment?.score);
  const results   = [];

  for (let i = 0; i < toProcess.length; i += 5) {
    const batch = toProcess.slice(i, i + 5);

    const analysed = await Promise.all(
      batch.map(async (entry) => {
        const msg = await anthropic.messages.create({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 128,
          system:     'Return ONLY valid JSON. No markdown.',
          messages:   [{
            role:    'user',
            content: `Analyse sentiment of this journal entry. Return JSON: { score: "positive"|"neutral"|"negative", keywords: [string, string, string] }\n\n${entry.body}`,
          }],
        });

        const sentiment = JSON.parse(msg.content[0].text);
        await Entry.findByIdAndUpdate(entry._id, { sentiment });
        return { entryId: entry._id, sentiment };
      })
    );

    results.push(...analysed);
  }

  // Return cached results too
  const cached = entries
    .filter((e) => e.sentiment?.score)
    .map((e) => ({ entryId: e._id, sentiment: e.sentiment }));

  res.json([...cached, ...results]);
};

// 6. POST /api/ai/nl-search  — intent parsing → MongoDB query
export const nlSearch = async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ message: 'query is required' });

  const msg = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system:     'Return ONLY valid JSON. No markdown.',
    messages:   [{
      role:    'user',
      content: `Parse this natural language travel journal search into a MongoDB filter. Fields available: location (string), date (ISO date), sentiment.score ("positive"|"neutral"|"negative"), title (string). Return JSON object with only relevant fields using MongoDB operators if needed.\n\nSearch: "${query}"`,
    }],
  });

  const filter = JSON.parse(msg.content[0].text);

  const entries = await Entry.find({
    author: req.user._id,
    ...filter,
  })
    .sort({ date: -1 })
    .populate('author', 'name profilePic');

  res.json(entries);
};
