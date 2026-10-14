import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeleteTestModal from '@/components/admin/tests/list/DeleteTestModal';
import BulkDeleteModal from '@/components/admin/tests/list/BulkDeleteModal';
import TestUnlockModal from '@/components/admin/tests/list/TestUnlockModal';
import TestTable from '@/components/admin/tests/list/TestTable';
import { savedPreviewData } from '@/components/admin/tests/preview/savedPreviewData';

afterEach(cleanup);
const test = { id: 'test-a', title: 'Reading A', test_type: 'reading', is_active: true };
const tableProps = {
  tests: [test],
  questions: [],
  selectedIds: [],
  sortConfig: {},
  onSelectionChange: vi.fn(),
  onSort: vi.fn(),
  onDuplicate: vi.fn(),
  onExport: vi.fn(),
};
const input = () => screen.getByRole('textbox', { name: 'Confirmation text' });

describe('Test management accident protection', () => {
  it('defaults to locked edits and deletes while title opens safe preview', () => {
    const edit = vi.fn(),
      remove = vi.fn(),
      preview = vi.fn();
    render(<TestTable {...tableProps} onEdit={edit} onDelete={remove} onPreview={preview} />);
    expect(screen.getByRole('button', { name: /Edit locked/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Delete locked/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reading A' }));
    expect(preview).toHaveBeenCalledWith(test);
    expect(edit).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });
  it('requires deliberate UNLOCK confirmation', () => {
    const confirm = vi.fn();
    render(<TestUnlockModal isOpen onClose={vi.fn()} onConfirm={confirm} />);
    expect(screen.getByRole('button', { name: 'Unlock changes' })).toBeDisabled();
    fireEvent.change(input(), { target: { value: 'UNLOCK' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock changes' }));
    expect(confirm).toHaveBeenCalledTimes(1);
  });
  it('requires exact test title, rejects generic DELETE and clears when target changes', () => {
    const confirm = vi.fn();
    const props = { isOpen: true, onClose: vi.fn(), onConfirm: confirm };
    const { rerender } = render(<DeleteTestModal {...props} test={test} />);
    fireEvent.change(input(), { target: { value: 'DELETE' } });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    fireEvent.change(input(), { target: { value: test.title } });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    rerender(<DeleteTestModal {...props} test={{ ...test, id: 'test-b' }} />);
    expect(input()).toHaveValue('');
    expect(confirm).not.toHaveBeenCalled();
  });
  it('bulk delete requires count and resets even when only the selection identity changes', () => {
    const props = { isOpen: true, count: 2, onClose: vi.fn(), onConfirm: vi.fn() };
    const { rerender } = render(<BulkDeleteModal {...props} confirmationKey="a,b" />);
    fireEvent.change(input(), { target: { value: 'DELETE 2 TESTS' } });
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
    rerender(<BulkDeleteModal {...props} confirmationKey="a,c" />);
    expect(input()).toHaveValue('');
  });
  it('blocks repeat submits and closing during deletion; retains confirmation after failure', async () => {
    let reject;
    const confirm = vi.fn(
      () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        })
    );
    const close = vi.fn();
    render(<DeleteTestModal test={test} isOpen onClose={close} onConfirm={confirm} />);
    fireEvent.change(input(), { target: { value: test.title } });
    const button = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(input()).toBeDisabled();
    await act(async () => reject(new Error('offline')));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(input()).toHaveValue(test.title);
    expect(close).not.toHaveBeenCalled();
  });
  it('clears confirmation on close and reopen', () => {
    const props = { test, onClose: vi.fn(), onConfirm: vi.fn() };
    const { rerender } = render(<DeleteTestModal {...props} isOpen />);
    fireEvent.change(input(), { target: { value: test.title } });
    rerender(<DeleteTestModal {...props} isOpen={false} />);
    rerender(<DeleteTestModal {...props} isOpen />);
    expect(input()).toHaveValue('');
  });
});

describe('Locked test preview snapshots', () => {
  it('uses question rows for legacy passages without embedded groups and does not mutate inputs', () => {
    const rows = [{ id: 'q1', section: 1, question_number: 1, group_instructions: 'Instructions' }];
    const data = savedPreviewData({ ...test, content: 'Plain passage' }, rows);
    expect(data.sections[0].content).toBe('Plain passage');
    expect(data.sections[0].groups[0].questions).toEqual(rows);
    expect(rows).toEqual([
      { id: 'q1', section: 1, question_number: 1, group_instructions: 'Instructions' },
    ]);
  });
  it('supports writing JSON and plain legacy prompts, speaking rows and listening groups', () => {
    expect(
      savedPreviewData(
        { test_type: 'writing', content: 'Write about travel', task_type: 'Task 2' },
        []
      ).tasks['Task 2'].prompt
    ).toBe('Write about travel');
    expect(
      savedPreviewData({ test_type: 'writing', content: '{"Task 1":{"prompt":"Chart"}}' }, [])
        .tasks['Task 1'].prompt
    ).toBe('Chart');
    expect(
      savedPreviewData({ test_type: 'speaking' }, [
        { question_number: 2, content: 'Cue', correct_answer: 'Prompt' },
      ]).parts[0]
    ).toMatchObject({ part_number: 2, content: 'Cue', prompt: 'Prompt' });
    const content = JSON.stringify([
      { audio_url: 'audio.mp3', question_groups: [{ questions: [{ id: 'embedded' }] }] },
    ]);
    expect(
      savedPreviewData({ test_type: 'listening', content }, []).sections[0].groups[0].questions[0]
        .id
    ).toBe('embedded');
  });
});
