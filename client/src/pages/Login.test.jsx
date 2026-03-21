import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import Login from './Login';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// ── mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, useNavigate: () => mockNavigate };
});

vi.mock('../api/axios', () => ({ default: { post: vi.fn() } }));

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// useAuth is called as a hook — mock it as a plain vi.fn so each test can shape its return
vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

// ── helpers ──────────────────────────────────────────────────────────────────

const renderLogin = () => render(<Login />, { wrapper: MemoryRouter });

/** Fills email + password and clicks Sign in */
const submitLogin = async (email = 'alice@test.com', password = 'pass123') => {
  const { container } = renderLogin();
  await userEvent.type(container.querySelector('input[type="email"]'), email);
  await userEvent.type(container.querySelector('input[type="password"]'), password);
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ login: vi.fn() });
  });

  // ── inputs & labels ────────────────────────────────────────────────────────

  it('renders email input with "Email address" label', () => {
    const { container } = renderLogin();
    expect(screen.getByText(/email address/i)).toBeInTheDocument();
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
  });

  it('renders password input with "Password" label', () => {
    const { container } = renderLogin();
    // getByText matches the label; not the input type attribute
    expect(screen.getByText(/^password$/i)).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
  });

  // ── disabled state ─────────────────────────────────────────────────────────

  it('submit button is enabled initially (disabled attr only applied while loading)', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled();
  });

  it('does not call api when submitted with empty fields (HTML5 required blocks submission)', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it('disables submit button and changes text to "Signing in…" while request is in-flight', async () => {
    let resolvePost;
    api.post.mockReturnValue(new Promise((r) => { resolvePost = r; }));
    const { container } = renderLogin();

    await userEvent.type(container.querySelector('input[type="email"]'), 'alice@test.com');
    await userEvent.type(container.querySelector('input[type="password"]'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    // Resolve so the component can settle
    resolvePost({ data: { token: 'tok', name: 'Alice' } });
  });

  // ── successful submit ──────────────────────────────────────────────────────

  it('calls POST /api/auth/login with email and password', async () => {
    api.post.mockResolvedValue({ data: { _id: 'u1', token: 'tok', name: 'Alice' } });
    await submitLogin();

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'alice@test.com',
      password: 'pass123',
    });
  });

  it('calls login() from AuthContext with the response data on success', async () => {
    const userData = { _id: 'u1', token: 'tok', name: 'Alice' };
    api.post.mockResolvedValue({ data: userData });
    const mockLogin = vi.fn();
    useAuth.mockReturnValue({ login: mockLogin });

    await submitLogin();

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith(userData));
  });

  it('navigates to "/" after successful login', async () => {
    api.post.mockResolvedValue({ data: { _id: 'u1', token: 'tok', name: 'Alice' } });
    await submitLogin();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  // ── error handling ─────────────────────────────────────────────────────────

  it('shows error toast with server message on 401 response', async () => {
    api.post.mockRejectedValue({
      response: { status: 401, data: { message: 'Invalid credentials' } },
    });
    await submitLogin();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials'),
    );
  });

  it('shows fallback "Login failed" toast when response has no message', async () => {
    api.post.mockRejectedValue(new Error('Network error'));
    await submitLogin();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Login failed'),
    );
  });
});
