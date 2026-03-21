import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const STEPS = ['Basic Info', 'Your Story', 'Add Photos'];

export default function CreateEntry() {
  const navigate = useNavigate();
  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState({ title: '', location: '', date: '', body: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex gap-8">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col gap-2 w-48 shrink-0">
        {STEPS.map((label, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl text-sm ${i === step ? 'bg-terracotta/10 text-terracotta font-semibold' : 'text-gray-400'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === step ? 'bg-terracotta text-white' : i < step ? 'bg-forest text-white' : 'bg-gray-100 text-gray-400'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            {label}
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="flex-1">
        <div className="flex gap-1 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-terracotta' : 'bg-gray-200'}`} />
          ))}
        </div>

        <h2 className="font-display text-2xl font-bold text-gray-900 mb-1">{STEPS[step]}</h2>

        {step === 0 && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Entry Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Golden Hour in Santorini..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Oia, Santorini, Greece"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Journal Entry</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={12}
              placeholder="Write about your experience..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 resize-none"
            />
          </div>
        )}

        {step === 2 && (
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-3">Photos (up to 10)</label>
            <div className="grid grid-cols-3 gap-3">
              {[...files].map((f, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
              {files.length < 10 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-terracotta transition">
                  <span className="text-3xl text-gray-300">+</span>
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

        <div className="flex justify-between mt-8">
          {step > 0 ? (
            <button onClick={back} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
              ← Back
            </button>
          ) : <div />}

          {step < 2 ? (
            <button
              onClick={next}
              disabled={step === 0 && (!form.title || !form.location || !form.date)}
              className="bg-terracotta text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
            >
              Next: {STEPS[step + 1]} →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-terracotta text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save Entry'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
