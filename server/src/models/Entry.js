import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url:     { type: String, required: true },
    caption: { type: String, default: '' },
    altText: { type: String, default: '' },
  },
  { _id: false }
);

const entrySchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date:     { type: Date, required: true },
    body:     { type: String, required: true },
    images:   [imageSchema],
    author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    locationInsights: {
      etiquette: { type: String, default: '' },
      phrases:   [String],
      currency:  { type: String, default: '' },
      season:    { type: String, default: '' },
      hiddenGem: { type: String, default: '' },
    },

    sentiment: {
      score:    { type: String, enum: ['positive', 'neutral', 'negative'], default: null },
      keywords: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

entrySchema.index({ title: 'text', location: 'text', body: 'text' });

const Entry = mongoose.model('Entry', entrySchema);
export default Entry;
