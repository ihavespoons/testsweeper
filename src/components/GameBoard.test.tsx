import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameBoard } from './GameBoard';
import type { CellState } from '../types';

describe('GameBoard', () => {
  const createCell = (overrides: Partial<CellState> = {}): CellState => ({
    content: 0,
    isRevealed: false,
    isFlagged: false,
    ...overrides,
  });

  const createGrid = (rows: number, cols: number): CellState[][] => {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => createCell())
    );
  };

  describe('rendering', () => {
    it('renders nothing for an empty grid', () => {
      const { container } = render(
        <GameBoard grid={[]} onCellReveal={vi.fn()} onCellFlag={vi.fn()} />
      );

      expect(container.querySelector('.game-board')).toBeNull();
    });

    it('renders a 3x3 grid with correct number of cells', () => {
      const grid = createGrid(3, 3);
      render(
        <GameBoard grid={grid} onCellReveal={vi.fn()} onCellFlag={vi.fn()} />
      );

      const cells = screen.getAllByTestId('cell');
      expect(cells).toHaveLength(9);
    });

    it('renders a 5x10 grid with correct number of cells', () => {
      const grid = createGrid(5, 10);
      render(
        <GameBoard grid={grid} onCellReveal={vi.fn()} onCellFlag={vi.fn()} />
      );

      const cells = screen.getAllByTestId('cell');
      expect(cells).toHaveLength(50);
    });

    it('renders cells with correct content', () => {
      const grid: CellState[][] = [
        [createCell({ isRevealed: true, content: 1 }), createCell({ isFlagged: true })],
        [createCell({ isRevealed: true, content: 'mine' }), createCell()],
      ];
      render(
        <GameBoard grid={grid} onCellReveal={vi.fn()} onCellFlag={vi.fn()} />
      );

      const cells = screen.getAllByTestId('cell');
      expect(cells[0]).toHaveTextContent('1');
      expect(cells[1]).toHaveTextContent('🚩');
      expect(cells[2]).toHaveTextContent('💣');
      expect(cells[3]).toHaveTextContent('');
    });

    it('applies correct grid template styles', () => {
      const grid = createGrid(4, 6);
      render(
        <GameBoard grid={grid} onCellReveal={vi.fn()} onCellFlag={vi.fn()} />
      );

      const board = screen.getByRole('grid');
      expect(board).toHaveStyle({
        gridTemplateRows: 'repeat(4, 1fr)',
        gridTemplateColumns: 'repeat(6, 1fr)',
      });
    });

    it('has game-board class', () => {
      const grid = createGrid(2, 2);
      render(
        <GameBoard grid={grid} onCellReveal={vi.fn()} onCellFlag={vi.fn()} />
      );

      const board = screen.getByRole('grid');
      expect(board).toHaveClass('game-board');
    });

    it('renders rows with correct class', () => {
      const grid = createGrid(3, 3);
      const { container } = render(
        <GameBoard grid={grid} onCellReveal={vi.fn()} onCellFlag={vi.fn()} />
      );

      const rows = container.querySelectorAll('.game-board__row');
      expect(rows).toHaveLength(3);
    });
  });

  describe('cell interactions', () => {
    it('calls onCellReveal with correct coordinates when cell is clicked', async () => {
      const user = userEvent.setup();
      const onCellReveal = vi.fn();
      const grid = createGrid(3, 3);

      render(
        <GameBoard grid={grid} onCellReveal={onCellReveal} onCellFlag={vi.fn()} />
      );

      const cells = screen.getAllByTestId('cell');
      await user.click(cells[4]); // Middle cell (row 1, col 1)

      expect(onCellReveal).toHaveBeenCalledTimes(1);
      expect(onCellReveal).toHaveBeenCalledWith(1, 1);
    });

    it('calls onCellReveal with correct coordinates for corner cells', async () => {
      const user = userEvent.setup();
      const onCellReveal = vi.fn();
      const grid = createGrid(3, 3);

      render(
        <GameBoard grid={grid} onCellReveal={onCellReveal} onCellFlag={vi.fn()} />
      );

      const cells = screen.getAllByTestId('cell');

      // Top-left (0, 0)
      await user.click(cells[0]);
      expect(onCellReveal).toHaveBeenLastCalledWith(0, 0);

      // Top-right (0, 2)
      await user.click(cells[2]);
      expect(onCellReveal).toHaveBeenLastCalledWith(0, 2);

      // Bottom-left (2, 0)
      await user.click(cells[6]);
      expect(onCellReveal).toHaveBeenLastCalledWith(2, 0);

      // Bottom-right (2, 2)
      await user.click(cells[8]);
      expect(onCellReveal).toHaveBeenLastCalledWith(2, 2);
    });

    it('calls onCellFlag with correct coordinates when cell is right-clicked', async () => {
      const user = userEvent.setup();
      const onCellFlag = vi.fn();
      const grid = createGrid(3, 3);

      render(
        <GameBoard grid={grid} onCellReveal={vi.fn()} onCellFlag={onCellFlag} />
      );

      const cells = screen.getAllByTestId('cell');
      await user.pointer({
        keys: '[MouseRight]',
        target: cells[5], // Row 1, Col 2
      });

      expect(onCellFlag).toHaveBeenCalledTimes(1);
      expect(onCellFlag).toHaveBeenCalledWith(1, 2);
    });

    it('handles interactions on non-square grids correctly', async () => {
      const user = userEvent.setup();
      const onCellReveal = vi.fn();
      const grid = createGrid(2, 4); // 2 rows, 4 columns

      render(
        <GameBoard grid={grid} onCellReveal={onCellReveal} onCellFlag={vi.fn()} />
      );

      const cells = screen.getAllByTestId('cell');

      // Last cell of first row (0, 3)
      await user.click(cells[3]);
      expect(onCellReveal).toHaveBeenLastCalledWith(0, 3);

      // First cell of second row (1, 0)
      await user.click(cells[4]);
      expect(onCellReveal).toHaveBeenLastCalledWith(1, 0);

      // Last cell (1, 3)
      await user.click(cells[7]);
      expect(onCellReveal).toHaveBeenLastCalledWith(1, 3);
    });
  });

  describe('accessibility', () => {
    it('has role="grid" on the board container', () => {
      const grid = createGrid(3, 3);
      render(
        <GameBoard grid={grid} onCellReveal={vi.fn()} onCellFlag={vi.fn()} />
      );

      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('has correct aria-label describing board dimensions', () => {
      const grid = createGrid(8, 10);
      render(
        <GameBoard grid={grid} onCellReveal={vi.fn()} onCellFlag={vi.fn()} />
      );

      expect(screen.getByRole('grid')).toHaveAttribute(
        'aria-label',
        'Minesweeper board with 8 rows and 10 columns'
      );
    });

    it('has role="row" on each row container', () => {
      const grid = createGrid(3, 3);
      render(
        <GameBoard grid={grid} onCellReveal={vi.fn()} onCellFlag={vi.fn()} />
      );

      const rows = screen.getAllByRole('row');
      expect(rows).toHaveLength(3);
    });
  });
});
