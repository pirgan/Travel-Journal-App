import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import BrandLogo from '../components/BrandLogo';

// Maximum images a user can attach to a single entry
const MAX_IMAGES = 20;

// Step definitions for the multi-step form wizard.
// Each step maps to a section of the entry: metadata → body → photos.
const STEPS = [
  { label: 'Basic Info',  sub: 'Title, location & date',  title: 'Basic Information', blurb: "Let's start with the essentials of your journey." },
  { label: 'Your Story', sub: 'Write your journal entry', title: 'Your Story',       blurb: 'Capture the moments, feelings, and details you want to remember.' },
  { label: 'Add Photos', sub: `Upload up to ${MAX_IMAGES} images`, title: 'Add Photos', blurb: `Add up to ${MAX_IMAGES} images to bring this memory to life.` },
];

export default function CreateEntry() {
  const navigate = useNavigate();
  // Current wizard step index (0 = Basic Info, 1 = Your Story, 2 = Add Photos)
  const [step, setStep]   = useState(0);
  // Controlled state for all text fields
  const [form, setForm]   = useState({ title: '', location: '', date: '', body: '' });
  // Local File objects selected by the user — uploaded to Cloudinary on submit
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Advance to the next step, clamped to the last step
  const next = () => setStep((s) => Math.min(s + 1, 2));
  // Go back one step, clamped to the first step
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Assemble a multipart/form-data request and POST it to the entries API.
  // The server's multer middleware intercepts the 'images' fields and streams
  // each file to Cloudinary before the createEntry controller runs.
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      // Append each text field individually
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      // Append each File under the 'images' key (multer picks these up as req.files)
      files.forEach((f) => fd.append('images', f));
      await api.post('/entries', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Entry created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-border-mid rounded-lg px-4 py-3 text-sm text-ink-dark placeholder:text-ink-muted bg-white focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/15';

  // Progress bar percentage based on the current step
  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#FCF9F3] flex flex-col">
      {/* Top bar with brand logo, page title, and cancel action */}
      <div className="bg-white border-b border-border-warm px-6 sm:px-10 lg:px-12 h-[72px] flex items-center justify-between shrink-0 gap-4">
        <Link to="/" className="min-w-0">
          <BrandLogo />
        </Link>
        <span className="text-sm font-medium text-ink-secondary truncate">New Journal Entry</span>
        <div className="flex items-center gap-3 text-sm shrink-0">
          <button type="button" className="text-ink-secondary hover:text-ink-dark transition hidden sm:inline">
            Save Draft
          </button>
          <div className="w-px h-5 bg-border-mid hidden sm:block" />
          <Link to="/" className="text-ink-muted hover:text-ink-secondary transition">
            Cancel
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:flex-row min-h-0">
        {/* Sidebar: step list showing completed / active / pending states */}
        <div className="hidden md:flex flex-col w-[300px] shrink-0 bg-[#FCF9F3] border-r border-border-warm px-8 py-10">
          <h2 className="font-display text-[22px] font-bold text-ink-dark mb-1">Your Entry</h2>
          <p className="text-ink-secondary text-[13px] leading-snug mb-10">
            Fill in the details for your new travel memory.
          </p>
          <div className="relative pl-1">
            {/* Vertical connector line behind the step dots */}
            <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border-warm" aria-hidden />
            <div className="space-y-6">
              {STEPS.map((s, i) => (
                <div key={i} className="relative flex items-start gap-3">
                  {/* Step dot: green = done, terracotta = active, grey = pending */}
                  <div
                    className={`relative z-[1] w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i < step ? 'bg-forest text-white' : i === step ? 'bg-terracotta text-white' : 'bg-white border-2 border-border-mid text-ink-muted'
                    }`}
                  >
                    {i < step ? '✓' : i + 1}
                  </div>
                  <div className="pt-0.5">
                    <p className={`text-sm font-semibold leading-tight mb-0.5 ${
                      i === step ? 'text-terracotta' : i < step ? 'text-ink-secondary' : 'text-ink-muted'
                    }`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-ink-muted">{s.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content area — renders a different form section per step */}
        <div className="flex-1 bg-[#FCF9F3] px-6 sm:px-12 lg:px-20 py-10 lg:py-12 flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <span className="text-xs font-bold text-terracotta tracking-[0.2em] uppercase">
                Step {step + 1} of {STEPS.length}
              </span>
              {/* Progress bar fills proportionally as the user advances through steps */}
              <div className="h-1 flex-1 min-w-[120px] max-w-md rounded-full bg-border-mid overflow-hidden">
                <div
                  className="h-full bg-terracotta rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <h2 className="font-display text-[clamp(1.5rem,3vw,1.85rem)] font-bold text-ink-dark mb-1">
              {STEPS[step].title}
            </h2>
            <p className="text-ink-secondary text-sm">{STEPS[step].blurb}</p>
          </div>

          {/* Step 0: title, location, date */}
          {step === 0 && (
            <div className="space-y-5 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-ink-secondary mb-1.5">Entry Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Golden Hour in Santorini..."
                  className={`${inputCls} border-terracotta/45 font-display text-base`}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-ink-secondary mb-1.5">Location</label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Oia, Santorini, Greece"
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-ink-secondary mb-1.5">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className={`${inputCls} pr-10`}
                    />
                    <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: journal body text */}
          {step === 1 && (
            <div className="max-w-xl">
              <label className="block text-xs font-bold text-ink-secondary mb-1.5">Journal Entry</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={12}
                placeholder="Write about your experience..."
                className={`${inputCls} resize-none min-h-[280px]`}
              />
            </div>
          )}

          {/* Step 2: photo picker.
              Selected files are previewed locally via createObjectURL.
              They are not sent to the server until the user hits "Save Entry". */}
          {step === 2 && (
            <div className="max-w-xl">
              <label className="block text-xs font-bold text-ink-secondary mb-3">
                Photos ({files.length}/{MAX_IMAGES})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[...files].map((f, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-border-warm">
                    {/* Temporary object URL for in-browser preview — does not consume upload quota */}
                    <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
                {/* Hide the picker once the per-entry image cap is reached */}
                {files.length < MAX_IMAGES && (
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border-mid flex flex-col items-center justify-center cursor-pointer hover:border-terracotta hover:bg-terracotta-soft/50 transition gap-1">
                    <span className="text-3xl text-ink-muted">+</span>
                    <span className="text-xs text-ink-muted">Add photos</span>
                    {/* Accumulate selected files into state without replacing previous picks */}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files)])}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Navigation footer: Back / Next or Save on the final step */}
          <div className="flex justify-between mt-auto pt-12 max-w-xl">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                className="flex items-center gap-2 px-5 py-2.5 border border-border-mid rounded-lg text-sm text-ink-secondary bg-white hover:bg-cream/60 transition"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              // Disable Next on step 0 until the required fields are filled
              <button
                type="button"
                onClick={next}
                disabled={step === 0 && (!form.title || !form.location || !form.date)}
                className="bg-terracotta text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-btn disabled:opacity-40 inline-flex items-center gap-2"
              >
                Next: {STEPS[step + 1].label}
                <span aria-hidden>→</span>
              </button>
            ) : (
              // Final step: submit triggers the API call
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-terracotta text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-btn disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save Entry'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
