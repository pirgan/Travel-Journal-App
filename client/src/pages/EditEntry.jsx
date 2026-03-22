import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

// Maximum total images allowed per entry (enforced here and on the server)
const MAX_IMAGES = 20;

export default function EditEntry() {
  // Extract the entry id from the URL, e.g. /entry/abc123/edit → id = 'abc123'
  const { id }    = useParams();
  const navigate  = useNavigate();

  // Controlled form state for the text fields
  const [form, setForm]       = useState({ title: '', location: '', date: '', body: '' });
  // Images already saved to Cloudinary (loaded from the API)
  const [existingImages, setExistingImages] = useState([]);
  // New local files the user has picked but not yet uploaded
  const [newFiles, setNewFiles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  // On mount: fetch all entries and find the one matching this id.
  // Prefill the form with its current values so the user edits existing data.
  useEffect(() => {
    api.get('/entries').then(({ data }) => {
      const entry = data.find((e) => e._id === id);
      if (!entry) { navigate('/'); return; }  // entry not found — redirect home
      setForm({
        title:    entry.title,
        location: entry.location,
        date:     entry.date?.slice(0, 10) ?? '',  // trim ISO timestamp to YYYY-MM-DD for the date input
        body:     entry.body,
      });
      setExistingImages(entry.images ?? []);
    }).finally(() => setLoading(false));
  }, [id, navigate]);

  // Build a multipart/form-data payload and PUT it to the API.
  // The server's multer middleware streams newFiles straight to Cloudinary before the controller runs.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      // Append each text field as a form key-value pair
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      // Append each new image file under the 'images' field name (matches multer's upload.array('images'))
      newFiles.forEach((f) => fd.append('images', f));
      await api.put(`/entries/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Entry updated!');
      navigate(`/entry/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to update entry');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-border-mid rounded-xl px-4 py-3 text-sm text-ink-dark placeholder:text-ink-muted bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/15';

  if (loading) return <div className="flex justify-center py-20 text-ink-muted">Loading…</div>;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="flex-1 flex justify-center px-6 py-10 sm:px-12">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
          <div>
            <h2 className="font-display text-[28px] font-bold text-ink-dark mb-1">Edit your entry</h2>
            <p className="text-ink-secondary text-sm">Update the details below and save.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1.5">Entry Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Golden Hour in Santorini…"
              required
              className={`${inputCls} border-terracotta/40`}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">Location</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">📍</span>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Oia, Santorini, Greece"
                  required
                  className={`${inputCls} pl-9`}
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary mb-1.5">Journal Entry</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={10}
              placeholder="Write about your experience…"
              required
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Read-only grid of images already stored in Cloudinary for this entry */}
          {existingImages.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-2">Current Photos</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {existingImages.map((img, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-border-warm">
                    <img src={img.url} alt={img.altText || `Photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show the add-more picker only while the combined total is below MAX_IMAGES.
              Newly picked files are previewed via an object URL (browser-local, not yet uploaded). */}
          {existingImages.length + newFiles.length < MAX_IMAGES && (
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-2">
                Add More Photos ({existingImages.length + newFiles.length}/{MAX_IMAGES})
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {newFiles.map((f, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-border-warm">
                    {/* createObjectURL generates a temporary local URL for preview before upload */}
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                <label className="aspect-square rounded-xl border-2 border-dashed border-border-mid flex flex-col items-center justify-center cursor-pointer hover:border-terracotta hover:bg-terracotta-soft/50 transition gap-1">
                  <span className="text-3xl text-ink-muted">+</span>
                  <span className="text-xs text-ink-muted">Add photos</span>
                  {/* Hidden file input — the visible label above acts as the click target */}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => setNewFiles((prev) => [...prev, ...Array.from(e.target.files)])}
                  />
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            {/* Cancel navigates back to the view page without saving */}
            <Link
              to={`/entry/${id}`}
              className="px-5 py-2.5 border border-border-mid rounded-xl text-sm text-ink-secondary hover:bg-white transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-terracotta text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-btn disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
