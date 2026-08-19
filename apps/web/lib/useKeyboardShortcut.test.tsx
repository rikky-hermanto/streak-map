import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcut } from './useKeyboardShortcut';

function TestHarness({
  keyName,
  handler,
  enabled,
}: {
  keyName: string;
  handler: (e: KeyboardEvent) => void;
  enabled?: boolean;
}) {
  useKeyboardShortcut(keyName, handler, { enabled });
  return (
    <div>
      <input data-testid="text-input" />
    </div>
  );
}

describe('useKeyboardShortcut', () => {
  it('fires the handler when the matching key is pressed on window', () => {
    const handler = vi.fn();
    render(<TestHarness keyName="n" handler={handler} />);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire when focus is inside an input element', () => {
    const handler = vi.fn();
    const { getByTestId } = render(<TestHarness keyName="n" handler={handler} />);
    const input = getByTestId('text-input');

    const event = new KeyboardEvent('keydown', { key: 'n', bubbles: true });
    input.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not fire while an IME composition is active', () => {
    const handler = vi.fn();
    render(<TestHarness keyName="n" handler={handler} />);

    const event = new KeyboardEvent('keydown', { key: 'n', isComposing: true });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not fire when enabled is false', () => {
    const handler = vi.fn();
    render(<TestHarness keyName="n" handler={handler} enabled={false} />);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }));

    expect(handler).not.toHaveBeenCalled();
  });
});
