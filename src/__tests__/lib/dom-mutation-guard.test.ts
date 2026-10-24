// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { installDomMutationGuard } from '@/lib/domMutationGuard';

installDomMutationGuard();

describe('DOM mutation guard (browser translation)', () => {
  it('does not throw when removing a node a translator already moved', () => {
    const parent = document.createElement('div');
    const wrapper = document.createElement('font');
    const text = document.createTextNode('hello');
    wrapper.appendChild(text);
    parent.appendChild(wrapper);

    expect(() => parent.removeChild(text)).not.toThrow();
  });

  it('still removes a real child', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);

    parent.removeChild(child);

    expect(parent.childNodes).toHaveLength(0);
  });

  it('appends instead of throwing when the reference node moved', () => {
    const parent = document.createElement('div');
    const elsewhere = document.createElement('div');
    const moved = document.createElement('i');
    elsewhere.appendChild(moved);
    const inserted = document.createElement('b');

    expect(() => parent.insertBefore(inserted, moved)).not.toThrow();
    expect(parent.lastChild).toBe(inserted);
  });

  it('still inserts before a real reference node', () => {
    const parent = document.createElement('div');
    const first = document.createElement('i');
    parent.appendChild(first);
    const inserted = document.createElement('b');

    parent.insertBefore(inserted, first);

    expect(parent.firstChild).toBe(inserted);
  });

  it('is idempotent', () => {
    const once = Node.prototype.removeChild;
    installDomMutationGuard();
    expect(Node.prototype.removeChild).toBe(once);
  });
});

describe('DOM mutation guard with a real React tree', () => {
  it('survives a translator wrapping a text node before React updates it', async () => {
    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    const { act } = await import('react');

    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

    // Two sibling text nodes: React removes the second with parent.removeChild.
    const Label = ({ on }: { on: boolean }) =>
      React.createElement('p', null, 'Band ', on ? 'seven' : null);

    await act(async () => root.render(React.createElement(Label, { on: true })));

    // Google Translate replaces the text node with <font><font>translated</font></font>.
    const paragraph = host.querySelector('p')!;
    const original = paragraph.lastChild!;
    const font = document.createElement('font');
    font.textContent = 'Enviar respuesta';
    paragraph.replaceChild(font, original);

    await expect(
      act(async () => root.render(React.createElement(Label, { on: false })))
    ).resolves.not.toThrow();

    await act(async () => root.unmount());
    host.remove();
  });
});
