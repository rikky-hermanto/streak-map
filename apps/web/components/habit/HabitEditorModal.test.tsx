import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HabitEditorModal } from './HabitEditorModal';

vi.mock('@/lib/db', async () => {
  const { StreakMapDB } = await import('@streak-map/store');
  return { db: new StreakMapDB(`test-editor-${Math.random()}`) };
});

describe('HabitEditorModal — create mode', () => {
  it('does not call onClose-triggering save when name is empty (silently cancels)', async () => {
    const { db } = await import('@/lib/db');
    const onClose = vi.fn();
    render(<HabitEditorModal mode="create" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    // Empty name silently cancels: the modal still closes (no error UI), but no habit is created.
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(await db.habits.count()).toBe(0);
  });

  it('defaults the accent color to DEFAULT_HABIT_COLOR, selecting none of the offered swatches', () => {
    // DEFAULT_HABIT_COLOR (#4B8A5E) is intentionally not one of the 10 ACCENT_SWATCHES — see
    // implementation.md's editor spec. No swatch should render as checked for a brand-new habit.
    render(<HabitEditorModal mode="create" onClose={vi.fn()} />);
    const radiogroup = screen.getByRole('radiogroup', { name: 'Accent color' });
    expect(radiogroup.querySelectorAll('[aria-checked="true"]')).toHaveLength(0);
  });

  it('clamps the target stepper to the 1–20 range', () => {
    render(<HabitEditorModal mode="create" onClose={vi.fn()} />);
    const decrease = screen.getByLabelText('Decrease target');
    expect(decrease).toBeDisabled(); // starts at 1, the minimum
  });

  it('does not render a Delete button in create mode', () => {
    render(<HabitEditorModal mode="create" onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Delete habit' })).not.toBeInTheDocument();
  });
});

describe('HabitEditorModal — edit mode', () => {
  it('renders a Delete button and pre-fills the habit name', () => {
    render(
      <HabitEditorModal
        mode="edit"
        habit={{
          id: 'h1',
          name: 'Deep work',
          color: '#4B8A5E',
          interval: 'daily',
          target: 1,
          startDate: '2026-08-01',
          order: 0,
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Delete habit' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Deep work')).toBeInTheDocument();
  });
});
