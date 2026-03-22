import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-toastify';
import CreateEntry from './CreateEntry';
import api from '../api/axios';

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal();
  return { ...mod, useNavigate: () => mockNavigate };
});

vi.mock('../api/axios', () => ({ default: { post: vi.fn() } }));

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const renderForm = () => render(<CreateEntry />, { wrapper: MemoryRouter });

/**
 * Fills step 0 fields (title, location, date).
 * Requires `container` from the render result because the date input
 * has no placeholder and must be located via type attribute.
 */
const fillStep0 = async (container) => {
  await userEvent.type(
    screen.getByPlaceholderText('Golden Hour in Santorini...'),
    'Lisbon at Dawn',
  );
  await userEvent.type(
    screen.getByPlaceholderText('Oia, Santorini, Greece'),
    'Lisbon, Portugal',
  );
  const dateInput = container.querySelector('input[type="date"]');
  await userEvent.type(dateInput, '2024-06-01');
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('CreateEntry', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── step indicator ────────────────────────────────────────────────────────

  it('renders a 3-step indicator showing Basic Info, Your Story, Add Photos', () => {
    renderForm();
    // getAllByText because "Basic Info" appears in both the sidebar AND the <h2>
    expect(screen.getAllByText('Basic Info').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Your Story')).toBeInTheDocument();
    expect(screen.getByText('Add Photos')).toBeInTheDocument();
  });

  it('displays "Basic Information" as the active step heading on initial render', () => {
    renderForm();
    expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument();
  });

  it('renders a horizontal progress bar for the wizard', () => {
    const { container } = renderForm();
    expect(container.querySelector('.h-1.rounded-full.overflow-hidden')).toBeInTheDocument();
  });

  // ── step 0 validation / Next button ───────────────────────────────────────

  it('Next button is disabled when all step-0 fields are empty', () => {
    renderForm();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('Next button is disabled when only title is filled', async () => {
    renderForm();
    // Use exact placeholder to avoid ambiguity (both inputs reference "Santorini")
    await userEvent.type(
      screen.getByPlaceholderText('Golden Hour in Santorini...'),
      'My trip',
    );
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  it('Next button is enabled once title, location and date are all filled', async () => {
    const { container } = renderForm();
    await fillStep0(container);
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });

  it('clicking Next with valid step-0 data advances to step 1 (Your Story)', async () => {
    const { container } = renderForm();
    await fillStep0(container);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByRole('heading', { name: /your story/i })).toBeInTheDocument();
  });

  // ── step 1 → step 2 ───────────────────────────────────────────────────────

  it('advancing from step 1 to step 2 shows Add Photos heading', async () => {
    const { container } = renderForm();
    await fillStep0(container);
    await userEvent.click(screen.getByRole('button', { name: /next/i })); // → step 1
    await userEvent.click(screen.getByRole('button', { name: /next/i })); // → step 2
    expect(screen.getByRole('heading', { name: /add photos/i })).toBeInTheDocument();
  });

  it('Back button on step 1 returns to Basic Info', async () => {
    const { container } = renderForm();
    await fillStep0(container);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument();
  });

  // ── photo upload (step 2) ─────────────────────────────────────────────────

  it('step 2 contains a file input that accepts image/* with multiple attribute', async () => {
    const { container } = renderForm();
    await fillStep0(container);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/*');
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('selecting a photo file adds a preview image to the grid', async () => {
    global.URL.createObjectURL = vi.fn(() => 'blob:fake-preview');

    const { container } = renderForm();
    await fillStep0(container);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    const fileInput = container.querySelector('input[type="file"]');
    const photo = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, photo);

    // Preview images sit inside .aspect-square divs in the grid
    const previews = container.querySelectorAll('.aspect-square img');
    expect(previews).toHaveLength(1);
  });

  // ── submission (step 2) ───────────────────────────────────────────────────

  it('submitting calls POST /entries with a FormData body and multipart/form-data header', async () => {
    api.post.mockResolvedValue({ data: {} });
    global.URL.createObjectURL = vi.fn(() => 'blob:fake-preview');

    const { container } = renderForm();
    await fillStep0(container);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /save entry/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        '/entries',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
      ),
    );
  });

  it('shows success toast and navigates to "/" after successful submission', async () => {
    api.post.mockResolvedValue({ data: {} });

    const { container } = renderForm();
    await fillStep0(container);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /save entry/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Entry created!'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows error toast on submission failure', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'Server error' } } });

    const { container } = renderForm();
    await fillStep0(container);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    await userEvent.click(screen.getByRole('button', { name: /save entry/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Server error'));
  });
});
