import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import TestManagement from '@/components/admin/tests';
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  remove: vi.fn(),
  bulkRemove: vi.fn(),
  status: vi.fn(),
  fetch: vi.fn(),
  preview: vi.fn(),
  editor: vi.fn(),
}));
const passage = { id: 'existing', title: 'Protected test', test_type: 'reading', is_active: true };
vi.mock('@/hooks/admin/useTestManagement', () => ({
  useTestManagement: () => ({
    passages: [passage],
    questions: [],
    pagination: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    loading: false,
    fetchAllData: mocks.fetch,
    deleteTest: mocks.remove,
    bulkDeleteTests: mocks.bulkRemove,
    bulkUpdateStatus: mocks.status,
  }),
}));
vi.mock('@/hooks/admin/useTestSaving', () => ({
  useTestSaving: (onSuccess) => ({
    saveTest: async (...args) => {
      mocks.save(...args);
      onSuccess();
      return { id: 'existing' };
    },
  }),
}));
vi.mock('@/components/admin/tests/creation/TestCreator', () => ({
  default: (props) => {
    mocks.editor(props);
    return (
      <div>
        <button onClick={props.onCancel}>Leave editor</button>
        <button onClick={() => props.onSave({ passage })}>Save edited test</button>
      </div>
    );
  },
}));
vi.mock('@/components/admin/tests/preview/SavedTestPreview', () => ({
  default: (props) => {
    mocks.preview(props);
    return (
      <div>
        Isolated preview<button onClick={props.onClose}>Close safe preview</button>
      </div>
    );
  },
}));
// The motion boundary is irrelevant to mutation authorization and otherwise
// delays mounting the list while the test is checking immediate re-locking.
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const Div = ({
    children,
    variants: _v,
    initial: _i,
    animate: _a,
    exit: _e,
    transition: _t,
    ...props
  }) => React.createElement('div', props, children);
  return { m: { div: Div, button: Div, span: Div }, AnimatePresence: ({ children }) => children };
});
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
const open = () =>
  render(
    <MemoryRouter>
      <TooltipProvider>
        <TestManagement />
      </TooltipProvider>
    </MemoryRouter>
  );
async function unlock() {
  fireEvent.click(screen.getByRole('button', { name: 'Unlock changes' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Confirmation text' }), {
    target: { value: 'UNLOCK' },
  });
  fireEvent.click(screen.getAllByRole('button', { name: 'Unlock changes' }).at(-1));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Lock changes' })).toBeInTheDocument()
  );
}
describe('Lock authorization across management flow', () => {
  it('opens previews without mounting an editor or writing data', async () => {
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Protected test' }));
    await screen.findByText('Isolated preview');
    expect(mocks.editor).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('locks after editor exit and rejects an outstanding editor save callback', async () => {
    open();
    await unlock();
    fireEvent.click(screen.getByRole('button', { name: 'Edit', exact: true }));
    const editorProps = mocks.editor.mock.calls.at(-1)[0];
    fireEvent.click(screen.getByRole('button', { name: 'Leave editor' }));
    expect(screen.getByRole('button', { name: /Edit locked/ })).toBeDisabled();
    await act(async () => {
      await editorProps.onSave({ passage });
    });
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('dismisses the unlock notice after 4.5 seconds without closing the editor', async () => {
    open();
    await unlock();
    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole('button', { name: 'Edit', exact: true }));
      expect(screen.getByText(/Editing unlocked/)).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(4500));
      expect(screen.queryByText(/Editing unlocked/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save edited test' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
  it('locks after saving existing test', async () => {
    open();
    await unlock();
    fireEvent.click(screen.getByRole('button', { name: 'Edit', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Save edited test' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Edit locked/ })).toBeDisabled());
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });
  it('blocks all bulk mutations by default, then locks on module changes', async () => {
    open();
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    for (const name of ['Activate', 'Draft', 'Delete'])
      expect(screen.getByRole('button', { name, exact: true })).toBeDisabled();
    await unlock();
    fireEvent.click(screen.getByRole('button', { name: 'Listening', exact: true }));
    expect(screen.getByRole('button', { name: /Edit locked/ })).toBeDisabled();
    expect(mocks.status).not.toHaveBeenCalled();
    expect(mocks.bulkRemove).not.toHaveBeenCalled();
  });
  it('locks on canceling a delete without calling destructive methods', async () => {
    open();
    await unlock();
    fireEvent.click(screen.getByRole('button', { name: 'Delete', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel', exact: true }));
    expect(screen.getByRole('button', { name: /Delete locked/ })).toBeDisabled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
