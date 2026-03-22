import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

export default function Login() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPassword, setShow] = useState(false);
  const [loading, setLoading]   = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-[20px] shadow-card w-full max-w-[440px] p-10 sm:p-11">
        <h1 className="font-display text-[32px] font-bold text-ink-dark leading-tight mb-1">Welcome back</h1>
        <p className="text-ink-secondary text-sm mb-6">Sign in to continue your journey</p>

        <div className="flex items-center gap-2 mb-8">
          <span className="inline-flex items-center rounded-full bg-terracotta text-white text-sm font-semibold px-5 py-2.5 shadow-btn">
            Log In
          </span>
          <Link
            to="/register"
            className="text-sm font-medium text-ink-muted hover:text-ink-secondary px-3 py-2 transition"
          >
            Register
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-ink-secondary mb-1.5">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full border border-terracotta/45 rounded-xl px-4 py-3 text-sm text-ink-dark placeholder:text-ink-muted focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/15 bg-[#FAF6F1]"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-ink-secondary mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-border-mid rounded-xl px-4 py-3 pr-11 text-sm text-ink-dark focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/15 bg-[#FAF6F1]"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink-secondary rounded-md"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="text-right -mt-1">
            <button type="button" className="text-xs font-medium text-terracotta hover:underline">
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-terracotta text-white py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-btn disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in…' : (
              <>
                Sign In
                <span aria-hidden className="text-lg leading-none">&rarr;</span>
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-border-warm" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-ink-muted font-medium">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toast.info('Google sign-in is not configured yet.')}
          className="w-full flex items-center justify-center gap-2 border border-border-mid rounded-xl py-3 text-sm font-medium text-ink-mid bg-white hover:bg-cream/80 transition"
        >
          <svg className="w-4 h-4 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            <path strokeWidth="1.5" d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
          </svg>
          Continue with Google
        </button>
      </div>
    </AuthLayout>
  );
}
