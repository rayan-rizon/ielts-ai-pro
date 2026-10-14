import { act, fireEvent, render, renderHook, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEditorHistory } from '@/hooks/admin/useEditorHistory';
import TestEditorHeader from '@/components/admin/tests/creation/TestEditorHeader';
import { useState } from 'react';

afterEach(cleanup);
function useHarness(ready = true, limit = 60) {
  const [value, setValue] = useState({ title: 'Original', questions: [{ answer: 'rose' }] });
  const history = useEditorHistory(value, setValue, ready, limit);
  return { value, setValue, ...history };
}
describe('Complete editor Undo/Redo history', () => {
  it('restores content and metadata together, then redoes the change', () => {
    const { result } = renderHook(() => useHarness());
    expect(result.current.canUndo).toBe(false);
    act(() => result.current.setValue({ title: 'Updated', questions: [{ answer: 'tree' }] }));
    act(() => result.current.undo());
    expect(result.current.value).toEqual({ title: 'Original', questions: [{ answer: 'rose' }] });
    expect(result.current.canRedo).toBe(true);
    act(() => result.current.redo());
    expect(result.current.value).toEqual({ title: 'Updated', questions: [{ answer: 'tree' }] });
  });
  it('discards redo after a new edit following undo', () => {
    const { result } = renderHook(() => useHarness());
    act(() => result.current.setValue({ title: 'First' }));
    act(() => result.current.setValue({ title: 'Second' }));
    act(() => result.current.undo());
    act(() => result.current.setValue({ title: 'New branch' }));
    expect(result.current.canRedo).toBe(false);
    act(() => result.current.undo());
    expect(result.current.value.title).toBe('First');
  });
  it('starts at hydrated state and ignores unchanged snapshots', () => {
    const { result, rerender } = renderHook(({ ready }) => useHarness(ready), {
      initialProps: { ready: false },
    });
    act(() => result.current.setValue({ title: 'Loaded from DB' }));
    rerender({ ready: true });
    expect(result.current.canUndo).toBe(false);
    act(() => result.current.setValue({ title: 'Loaded from DB' }));
    expect(result.current.canUndo).toBe(false);
    act(() => result.current.setValue({ title: 'Edited' }));
    act(() => result.current.undo());
    expect(result.current.value.title).toBe('Loaded from DB');
  });
  it('bounds memory and safely stops at both ends', () => {
    const { result } = renderHook(() => useHarness(true, 3));
    for (let n = 1; n <= 5; n++) act(() => result.current.setValue({ title: String(n) }));
    for (let n = 0; n < 5; n++) act(() => result.current.undo());
    expect(result.current.value.title).toBe('3');
    expect(result.current.canUndo).toBe(false);
    for (let n = 0; n < 5; n++) act(() => result.current.redo());
    expect(result.current.value.title).toBe('5');
    expect(result.current.canRedo).toBe(false);
  });
  it('exposes named buttons and keeps save clicks explicit', () => {
    const undo = vi.fn(),
      redo = vi.fn(),
      save = vi.fn();
    render(
      <TestEditorHeader
        title="Example"
        metadata={{}}
        onMetadataChange={vi.fn()}
        onTitleChange={vi.fn()}
        onSave={save}
        onCancel={vi.fn()}
        history={{ undo, redo, canUndo: true, canRedo: false }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(save).toHaveBeenCalledWith(false);
    expect(screen.getByRole('textbox', { name: 'Test title' })).toHaveValue('Example');
  });
});
