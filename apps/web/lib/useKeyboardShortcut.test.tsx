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

  it('calls preventDefault on a Space keydown targeting a focused button, so the browser does not also fire a native click activation (avoiding a double check-in)', () => {
    const handler = vi.fn();
    function ButtonHarness() {
      useKeyboardShortcut(' ', handler);
      return <button type="button">Check in</button>;
    }
    const { getByRole } = render(<ButtonHarness />);
    const button = getByRole('button');
    button.focus();

    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    button.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it('re-registers the listener when the key changes but not merely because the handler identity changes across re-renders', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    let renderCount = 0;
    function ChurnHarness() {
      renderCount += 1;
      // Fresh inline arrow every render, as real call sites do.
      useKeyboardShortcut('n', () => {});
      return null;
    }
    const { rerender } = render(<ChurnHarness />);
    const addCallsAfterMount = addSpy.mock.calls.filter((c) => c[0] === 'keydown').length;

    rerender(<ChurnHarness />);
    rerender(<ChurnHarness />);
    const addCallsAfterRerenders = addSpy.mock.calls.filter((c) => c[0] === 'keydown').length;

    expect(renderCount).toBe(3);
    // The keydown listener must be added exactly once total, not once per render — proves the
    // effect isn't tearing down and re-adding on every commit despite a fresh handler identity.
    expect(addCallsAfterRerenders).toBe(addCallsAfterMount);

    addSpy.mockRestore();
  });
});
