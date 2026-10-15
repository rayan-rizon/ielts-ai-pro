import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import InstitutionBrand from '@/features/institution/components/InstitutionBrand';
import SettingsTab from '@/features/institution/components/tabs/SettingsTab';

const storage = vi.hoisted(() => ({ upload: vi.fn(), remove: vi.fn(), getPublicUrl: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { storage: { from: () => storage } } }));

const school = {
  id: 'school',
  name: 'Academy',
  logo_url: 'https://old.example/logo.png',
  owner_email: 'owner@example.com',
  currency: 'USD',
};
const file = () => new File(['png bytes'], 'logo.png', { type: 'image/png' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = vi.fn(() => 'blob:preview');
      static revokeObjectURL = vi.fn();
    }
  );
  storage.upload.mockResolvedValue({ error: null });
  storage.remove.mockResolvedValue({ error: null });
  storage.getPublicUrl.mockImplementation((path) => ({
    data: { publicUrl: `https://storage.example/${path}` },
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('institution branding', () => {
  it('shows the institution logo and permanent product attribution', () => {
    render(<InstitutionBrand institution={school} />);
    expect(screen.getByAltText('Academy logo')).toHaveAttribute('src', school.logo_url);
    expect(screen.getByText('Powered by IELTS AI Pro')).toBeVisible();
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Academy')).toBeVisible();
    expect(screen.getByText('Powered by IELTS AI Pro')).toBeVisible();
  });

  it('does not show a brand panel without an institution', () => {
    const { container } = render(<InstitutionBrand />);
    expect(container).toBeEmptyDOMElement();
  });

  it('previews a selection and only uploads when saving', async () => {
    const act = vi.fn().mockResolvedValue({ id: 'school' });
    render(<SettingsTab institution={school} act={act} />);
    fireEvent.change(screen.getByLabelText('Institution logo'), { target: { files: [file()] } });
    await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:preview'));
    expect(storage.upload).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    await waitFor(() =>
      expect(act).toHaveBeenCalledWith(
        'update',
        expect.objectContaining({
          name: 'Academy',
          logo_url: expect.stringMatching(/^https:\/\/storage.example\/school\/.+\.png$/),
        })
      )
    );
    expect(storage.upload).toHaveBeenCalledWith(
      expect.stringMatching(/^school\//),
      expect.any(File),
      expect.objectContaining({ upsert: false })
    );
  });

  it('rejects SVG and oversized images before upload', () => {
    render(<SettingsTab institution={school} act={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Institution logo'), {
      target: { files: [new File(['svg'], 'logo.svg', { type: 'image/svg+xml' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a PNG, JPG or WebP image');
    const large = file();
    Object.defineProperty(large, 'size', { value: 3 * 1024 * 1024 });
    fireEvent.change(screen.getByLabelText('Institution logo'), { target: { files: [large] } });
    expect(screen.getByRole('alert')).toHaveTextContent('smaller than 2 MB');
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('removes the saved logo without removing attribution', async () => {
    const act = vi.fn().mockResolvedValue({ id: 'school' });
    render(<SettingsTab institution={school} act={act} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove logo' }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('Powered by IELTS AI Pro')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    await waitFor(() =>
      expect(act).toHaveBeenCalledWith('update', expect.objectContaining({ logo_url: '' }))
    );
    expect(storage.remove).not.toHaveBeenCalled(); // Existing external images are never deleted.
  });

  it('cleans up a new upload when the institution update fails', async () => {
    const act = vi.fn().mockResolvedValue(null);
    render(<SettingsTab institution={school} act={act} />);
    fireEvent.change(screen.getByLabelText('Institution logo'), { target: { files: [file()] } });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    await waitFor(() =>
      expect(storage.remove).toHaveBeenCalledWith([expect.stringMatching(/^school\/.+\.png$/)])
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:preview');
  });

  it('keeps the original logo and does not save if uploading fails', async () => {
    storage.upload.mockResolvedValue({ error: { message: 'denied' } });
    const act = vi.fn();
    render(<SettingsTab institution={school} act={act} />);
    fireEvent.change(screen.getByLabelText('Institution logo'), { target: { files: [file()] } });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save details' })).toBeEnabled());
    expect(act).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
  });
});
