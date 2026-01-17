import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Cell } from './Cell';
import type { CellState } from '../types';

describe('Cell', () => {
  const createCell = (overrides: Partial<CellState> = {}): CellState => ({
    content: 0,
    isRevealed: false,
    isFlagged: false,
    ...overrides,
  });

  describe('rendering', () => {
    it('renders a hidden cell', () => {
      const cell = createCell();
      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={vi.fn()} />);

      const button = screen.getByTestId('cell');
      expect(button).toHaveClass('cell', 'cell--hidden');
      expect(button).toHaveTextContent('');
    });

    it('renders a flagged cell with flag emoji', () => {
      const cell = createCell({ isFlagged: true });
      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={vi.fn()} />);

      const button = screen.getByTestId('cell');
      expect(button).toHaveClass('cell--flagged');
      expect(button).toHaveTextContent('🚩');
    });

    it('renders a revealed empty cell', () => {
      const cell = createCell({ isRevealed: true, content: 0 });
      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={vi.fn()} />);

      const button = screen.getByTestId('cell');
      expect(button).toHaveClass('cell--revealed');
      expect(button).toHaveTextContent('');
    });

    it('renders a revealed cell with adjacent mine count', () => {
      const cell = createCell({ isRevealed: true, content: 3 });
      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={vi.fn()} />);

      const button = screen.getByTestId('cell');
      expect(button).toHaveClass('cell--revealed', 'cell--number-3');
      expect(button).toHaveTextContent('3');
    });

    it('renders a revealed mine cell with bomb emoji', () => {
      const cell = createCell({ isRevealed: true, content: 'mine' });
      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={vi.fn()} />);

      const button = screen.getByTestId('cell');
      expect(button).toHaveClass('cell--revealed', 'cell--mine');
      expect(button).toHaveTextContent('💣');
    });

    it('applies correct number classes for each mine count', () => {
      for (let count = 1; count <= 8; count++) {
        const cell = createCell({ isRevealed: true, content: count });
        const { unmount } = render(
          <Cell cell={cell} onReveal={vi.fn()} onFlag={vi.fn()} />
        );

        const button = screen.getByTestId('cell');
        expect(button).toHaveClass(`cell--number-${count}`);
        expect(button).toHaveTextContent(String(count));
        unmount();
      }
    });
  });

  describe('reveal functionality', () => {
    it('calls onReveal when clicking a hidden cell', async () => {
      const user = userEvent.setup();
      const onReveal = vi.fn();
      const cell = createCell();

      render(<Cell cell={cell} onReveal={onReveal} onFlag={vi.fn()} />);

      await user.click(screen.getByTestId('cell'));
      expect(onReveal).toHaveBeenCalledTimes(1);
    });

    it('does not call onReveal when clicking a revealed cell', async () => {
      const user = userEvent.setup();
      const onReveal = vi.fn();
      const cell = createCell({ isRevealed: true });

      render(<Cell cell={cell} onReveal={onReveal} onFlag={vi.fn()} />);

      await user.click(screen.getByTestId('cell'));
      expect(onReveal).not.toHaveBeenCalled();
    });

    it('does not call onReveal when clicking a flagged cell', async () => {
      const user = userEvent.setup();
      const onReveal = vi.fn();
      const cell = createCell({ isFlagged: true });

      render(<Cell cell={cell} onReveal={onReveal} onFlag={vi.fn()} />);

      await user.click(screen.getByTestId('cell'));
      expect(onReveal).not.toHaveBeenCalled();
    });
  });

  describe('flag functionality', () => {
    it('calls onFlag when right-clicking a hidden cell', async () => {
      const user = userEvent.setup();
      const onFlag = vi.fn();
      const cell = createCell();

      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={onFlag} />);

      await user.pointer({
        keys: '[MouseRight]',
        target: screen.getByTestId('cell'),
      });
      expect(onFlag).toHaveBeenCalledTimes(1);
    });

    it('calls onFlag when right-clicking a flagged cell (to unflag)', async () => {
      const user = userEvent.setup();
      const onFlag = vi.fn();
      const cell = createCell({ isFlagged: true });

      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={onFlag} />);

      await user.pointer({
        keys: '[MouseRight]',
        target: screen.getByTestId('cell'),
      });
      expect(onFlag).toHaveBeenCalledTimes(1);
    });

    it('does not call onFlag when right-clicking a revealed cell', async () => {
      const user = userEvent.setup();
      const onFlag = vi.fn();
      const cell = createCell({ isRevealed: true });

      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={onFlag} />);

      await user.pointer({
        keys: '[MouseRight]',
        target: screen.getByTestId('cell'),
      });
      expect(onFlag).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has correct aria-label for hidden cell', () => {
      const cell = createCell();
      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={vi.fn()} />);

      expect(screen.getByTestId('cell')).toHaveAttribute(
        'aria-label',
        'Hidden cell'
      );
    });

    it('has correct aria-label for flagged cell', () => {
      const cell = createCell({ isFlagged: true });
      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={vi.fn()} />);

      expect(screen.getByTestId('cell')).toHaveAttribute(
        'aria-label',
        'Flagged cell'
      );
    });

    it('has correct aria-label for revealed mine', () => {
      const cell = createCell({ isRevealed: true, content: 'mine' });
      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={vi.fn()} />);

      expect(screen.getByTestId('cell')).toHaveAttribute('aria-label', 'Mine');
    });

    it('has correct aria-label for revealed number', () => {
      const cell = createCell({ isRevealed: true, content: 3 });
      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={vi.fn()} />);

      expect(screen.getByTestId('cell')).toHaveAttribute(
        'aria-label',
        '3 adjacent mines'
      );
    });

    it('is a button element', () => {
      const cell = createCell();
      render(<Cell cell={cell} onReveal={vi.fn()} onFlag={vi.fn()} />);

      expect(screen.getByTestId('cell').tagName).toBe('BUTTON');
    });
  });
});
