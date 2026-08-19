import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';

interface EmptyStateProps {
  onCreateHabit: () => void;
}

export function EmptyState({ onCreateHabit }: EmptyStateProps) {
  return (
    <Panel className="mx-auto flex max-w-[420px] flex-col items-center bg-elevated px-8 py-18 text-center">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-border-hi text-2xl text-tx2">
        +
      </div>
      <h2 className="mb-2 text-base font-semibold text-tx1">No habits yet</h2>
      <p className="mb-6 max-w-80 text-[13px] text-tx2">
        Create a habit to start filling in the grid. Every check-in adds to the picture.
      </p>
      <Button variant="cta" onClick={onCreateHabit}>
        Create your first habit
      </Button>
    </Panel>
  );
}
