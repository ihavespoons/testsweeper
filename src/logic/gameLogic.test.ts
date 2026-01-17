import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createEmptyCell,
  createEmptyBoard,
  isValidPosition,
  getNeighbors,
  generateMinePositions,
  placeMines,
  countAdjacentMines,
  calculateNumbers,
  createBoard,
  createBoardWithMines,
} from './gameLogic';
import type { Position } from '../types';

describe('gameLogic', () => {
  describe('createEmptyCell', () => {
    it('creates a cell with content 0', () => {
      const cell = createEmptyCell();
      expect(cell.content).toBe(0);
    });

    it('creates a cell that is not revealed', () => {
      const cell = createEmptyCell();
      expect(cell.isRevealed).toBe(false);
    });

    it('creates a cell that is not flagged', () => {
      const cell = createEmptyCell();
      expect(cell.isFlagged).toBe(false);
    });
  });

  describe('createEmptyBoard', () => {
    it('creates a board with correct dimensions', () => {
      const board = createEmptyBoard(5, 8);
      expect(board).toHaveLength(5);
      expect(board[0]).toHaveLength(8);
    });

    it('fills the board with empty cells', () => {
      const board = createEmptyBoard(3, 3);
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          expect(board[row][col]).toEqual({
            content: 0,
            isRevealed: false,
            isFlagged: false,
          });
        }
      }
    });

    it('creates independent cell objects', () => {
      const board = createEmptyBoard(2, 2);
      board[0][0].content = 'mine';
      expect(board[0][1].content).toBe(0);
      expect(board[1][0].content).toBe(0);
    });
  });

  describe('isValidPosition', () => {
    it('returns true for valid positions', () => {
      expect(isValidPosition(0, 0, 5, 5)).toBe(true);
      expect(isValidPosition(4, 4, 5, 5)).toBe(true);
      expect(isValidPosition(2, 3, 5, 5)).toBe(true);
    });

    it('returns false for negative row', () => {
      expect(isValidPosition(-1, 0, 5, 5)).toBe(false);
    });

    it('returns false for negative col', () => {
      expect(isValidPosition(0, -1, 5, 5)).toBe(false);
    });

    it('returns false for row >= rows', () => {
      expect(isValidPosition(5, 0, 5, 5)).toBe(false);
    });

    it('returns false for col >= cols', () => {
      expect(isValidPosition(0, 5, 5, 5)).toBe(false);
    });
  });

  describe('getNeighbors', () => {
    it('returns 8 neighbors for a center cell', () => {
      const neighbors = getNeighbors(2, 2, 5, 5);
      expect(neighbors).toHaveLength(8);
    });

    it('returns correct neighbors for center cell', () => {
      const neighbors = getNeighbors(2, 2, 5, 5);
      const expected: Position[] = [
        { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
        { row: 2, col: 1 },                     { row: 2, col: 3 },
        { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 },
      ];
      expect(neighbors).toEqual(expect.arrayContaining(expected));
      expect(neighbors).toHaveLength(expected.length);
    });

    it('returns 3 neighbors for a corner cell', () => {
      const neighbors = getNeighbors(0, 0, 5, 5);
      expect(neighbors).toHaveLength(3);
      expect(neighbors).toEqual(expect.arrayContaining([
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ]));
    });

    it('returns 5 neighbors for an edge cell', () => {
      const neighbors = getNeighbors(0, 2, 5, 5);
      expect(neighbors).toHaveLength(5);
    });

    it('returns 3 neighbors for bottom-right corner', () => {
      const neighbors = getNeighbors(4, 4, 5, 5);
      expect(neighbors).toHaveLength(3);
      expect(neighbors).toEqual(expect.arrayContaining([
        { row: 3, col: 3 },
        { row: 3, col: 4 },
        { row: 4, col: 3 },
      ]));
    });
  });

  describe('generateMinePositions', () => {
    let mockRandom: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockRandom = vi.spyOn(Math, 'random');
    });

    afterEach(() => {
      mockRandom.mockRestore();
    });

    it('generates the correct number of mines', () => {
      const positions = generateMinePositions(5, 5, 5);
      expect(positions).toHaveLength(5);
    });

    it('generates unique positions', () => {
      const positions = generateMinePositions(10, 10, 20);
      const positionStrings = positions.map(p => `${p.row},${p.col}`);
      const uniquePositions = new Set(positionStrings);
      expect(uniquePositions.size).toBe(positions.length);
    });

    it('respects board boundaries', () => {
      const positions = generateMinePositions(5, 5, 10);
      for (const pos of positions) {
        expect(pos.row).toBeGreaterThanOrEqual(0);
        expect(pos.row).toBeLessThan(5);
        expect(pos.col).toBeGreaterThanOrEqual(0);
        expect(pos.col).toBeLessThan(5);
      }
    });

    it('excludes the specified position', () => {
      const excludePosition = { row: 2, col: 2 };
      const positions = generateMinePositions(5, 5, 24, excludePosition);

      const hasExcludedPosition = positions.some(
        p => p.row === excludePosition.row && p.col === excludePosition.col
      );
      expect(hasExcludedPosition).toBe(false);
    });

    it('excludes neighbors of the specified position', () => {
      const excludePosition = { row: 2, col: 2 };
      const positions = generateMinePositions(5, 5, 16, excludePosition);

      const excludedNeighbors = getNeighbors(2, 2, 5, 5);
      for (const neighbor of excludedNeighbors) {
        const hasNeighbor = positions.some(
          p => p.row === neighbor.row && p.col === neighbor.col
        );
        expect(hasNeighbor).toBe(false);
      }
    });

    it('limits mines to available cells when mineCount exceeds available space', () => {
      // 3x3 board = 9 cells, excluding center and 8 neighbors = 0 available
      const positions = generateMinePositions(3, 3, 10, { row: 1, col: 1 });
      expect(positions).toHaveLength(0);
    });

    it('handles edge case with exclude position at corner', () => {
      const excludePosition = { row: 0, col: 0 };
      const positions = generateMinePositions(5, 5, 21, excludePosition);

      // Corner has 3 neighbors, so 4 cells excluded total, 21 remaining
      expect(positions).toHaveLength(21);

      const hasExcludedPosition = positions.some(
        p => p.row === 0 && p.col === 0
      );
      expect(hasExcludedPosition).toBe(false);
    });
  });

  describe('placeMines', () => {
    it('places mines at specified positions', () => {
      const board = createEmptyBoard(3, 3);
      const minePositions: Position[] = [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
        { row: 2, col: 2 },
      ];

      const newBoard = placeMines(board, minePositions);

      expect(newBoard[0][0].content).toBe('mine');
      expect(newBoard[1][1].content).toBe('mine');
      expect(newBoard[2][2].content).toBe('mine');
    });

    it('does not modify original board', () => {
      const board = createEmptyBoard(3, 3);
      const minePositions: Position[] = [{ row: 0, col: 0 }];

      placeMines(board, minePositions);

      expect(board[0][0].content).toBe(0);
    });

    it('leaves non-mine cells unchanged', () => {
      const board = createEmptyBoard(3, 3);
      const minePositions: Position[] = [{ row: 0, col: 0 }];

      const newBoard = placeMines(board, minePositions);

      expect(newBoard[0][1].content).toBe(0);
      expect(newBoard[1][0].content).toBe(0);
      expect(newBoard[2][2].content).toBe(0);
    });
  });

  describe('countAdjacentMines', () => {
    it('returns 0 when no adjacent mines', () => {
      const board = createEmptyBoard(3, 3);
      expect(countAdjacentMines(board, 1, 1)).toBe(0);
    });

    it('counts single adjacent mine', () => {
      const board = createEmptyBoard(3, 3);
      board[0][0].content = 'mine';
      expect(countAdjacentMines(board, 1, 1)).toBe(1);
    });

    it('counts multiple adjacent mines', () => {
      const board = createEmptyBoard(3, 3);
      board[0][0].content = 'mine';
      board[0][1].content = 'mine';
      board[0][2].content = 'mine';
      expect(countAdjacentMines(board, 1, 1)).toBe(3);
    });

    it('counts all 8 adjacent mines', () => {
      const board = createEmptyBoard(3, 3);
      // Surround center with mines
      board[0][0].content = 'mine';
      board[0][1].content = 'mine';
      board[0][2].content = 'mine';
      board[1][0].content = 'mine';
      board[1][2].content = 'mine';
      board[2][0].content = 'mine';
      board[2][1].content = 'mine';
      board[2][2].content = 'mine';

      expect(countAdjacentMines(board, 1, 1)).toBe(8);
    });

    it('handles corner cell correctly', () => {
      const board = createEmptyBoard(3, 3);
      board[0][1].content = 'mine';
      board[1][0].content = 'mine';
      board[1][1].content = 'mine';

      expect(countAdjacentMines(board, 0, 0)).toBe(3);
    });

    it('handles edge cell correctly', () => {
      const board = createEmptyBoard(3, 3);
      board[0][0].content = 'mine';
      board[0][2].content = 'mine';

      expect(countAdjacentMines(board, 0, 1)).toBe(2);
    });

    it('returns 0 for empty board', () => {
      const board: ReturnType<typeof createEmptyBoard> = [];
      expect(countAdjacentMines(board, 0, 0)).toBe(0);
    });

    it('returns 0 for board with empty rows', () => {
      const board: ReturnType<typeof createEmptyBoard> = [[]];
      expect(countAdjacentMines(board, 0, 0)).toBe(0);
    });

    it('returns 0 for out-of-bounds position', () => {
      const board = createEmptyBoard(3, 3);
      board[0][0].content = 'mine';
      expect(countAdjacentMines(board, -1, 0)).toBe(0);
      expect(countAdjacentMines(board, 0, -1)).toBe(0);
      expect(countAdjacentMines(board, 3, 0)).toBe(0);
      expect(countAdjacentMines(board, 0, 3)).toBe(0);
    });
  });

  describe('calculateNumbers', () => {
    it('sets correct numbers for all cells', () => {
      let board = createEmptyBoard(3, 3);
      board[0][0].content = 'mine';

      board = calculateNumbers(board);

      // Cells adjacent to the mine at (0,0)
      expect(board[0][1].content).toBe(1);
      expect(board[1][0].content).toBe(1);
      expect(board[1][1].content).toBe(1);

      // Cells not adjacent to any mine
      expect(board[0][2].content).toBe(0);
      expect(board[2][0].content).toBe(0);
      expect(board[2][2].content).toBe(0);
    });

    it('does not modify mine cells', () => {
      let board = createEmptyBoard(3, 3);
      board[1][1].content = 'mine';

      board = calculateNumbers(board);

      expect(board[1][1].content).toBe('mine');
    });

    it('handles multiple mines correctly', () => {
      let board = createEmptyBoard(3, 3);
      board[0][0].content = 'mine';
      board[2][2].content = 'mine';

      board = calculateNumbers(board);

      // Center is adjacent to both mines
      expect(board[1][1].content).toBe(2);

      // Corners adjacent to one mine each
      expect(board[0][1].content).toBe(1);
      expect(board[1][0].content).toBe(1);
      expect(board[1][2].content).toBe(1);
      expect(board[2][1].content).toBe(1);
    });

    it('does not modify original board', () => {
      const board = createEmptyBoard(3, 3);
      board[0][0].content = 'mine';

      calculateNumbers(board);

      expect(board[0][1].content).toBe(0);
    });

    it('returns empty array for empty board', () => {
      const board: ReturnType<typeof createEmptyBoard> = [];
      const result = calculateNumbers(board);
      expect(result).toEqual([]);
    });

    it('returns array of empty rows for board with empty rows', () => {
      const board: ReturnType<typeof createEmptyBoard> = [[], []];
      const result = calculateNumbers(board);
      expect(result).toEqual([[], []]);
    });
  });

  describe('createBoard', () => {
    let mockRandom: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockRandom = vi.spyOn(Math, 'random');
    });

    afterEach(() => {
      mockRandom.mockRestore();
    });

    it('creates board with correct dimensions', () => {
      const board = createBoard({ rows: 10, cols: 15, mineCount: 20 });
      expect(board).toHaveLength(10);
      expect(board[0]).toHaveLength(15);
    });

    it('places correct number of mines', () => {
      const board = createBoard({ rows: 10, cols: 10, mineCount: 15 });

      let mineCount = 0;
      for (const row of board) {
        for (const cell of row) {
          if (cell.content === 'mine') {
            mineCount++;
          }
        }
      }

      expect(mineCount).toBe(15);
    });

    it('calculates numbers correctly', () => {
      // Create deterministic mine placement
      let callCount = 0;
      mockRandom.mockImplementation(() => {
        return (callCount++ % 100) / 100;
      });

      const board = createBoard({ rows: 5, cols: 5, mineCount: 3 });

      // Verify numbers are calculated
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          if (board[row][col].content !== 'mine') {
            const expectedCount = countAdjacentMines(board, row, col);
            expect(board[row][col].content).toBe(expectedCount);
          }
        }
      }
    });

    it('excludes first click position and neighbors from mine placement', () => {
      const excludePosition = { row: 2, col: 2 };
      const board = createBoard(
        { rows: 5, cols: 5, mineCount: 16 },
        excludePosition
      );

      // First click position should not have mine
      expect(board[2][2].content).not.toBe('mine');

      // Neighbors should not have mines
      const neighbors = getNeighbors(2, 2, 5, 5);
      for (const neighbor of neighbors) {
        expect(board[neighbor.row][neighbor.col].content).not.toBe('mine');
      }
    });

    it('creates all cells as unrevealed', () => {
      const board = createBoard({ rows: 5, cols: 5, mineCount: 5 });

      for (const row of board) {
        for (const cell of row) {
          expect(cell.isRevealed).toBe(false);
        }
      }
    });

    it('creates all cells as unflagged', () => {
      const board = createBoard({ rows: 5, cols: 5, mineCount: 5 });

      for (const row of board) {
        for (const cell of row) {
          expect(cell.isFlagged).toBe(false);
        }
      }
    });
  });

  describe('createBoardWithMines', () => {
    it('creates board with mines at exact positions', () => {
      const minePositions: Position[] = [
        { row: 0, col: 0 },
        { row: 2, col: 3 },
        { row: 4, col: 4 },
      ];

      const board = createBoardWithMines(5, 5, minePositions);

      expect(board[0][0].content).toBe('mine');
      expect(board[2][3].content).toBe('mine');
      expect(board[4][4].content).toBe('mine');
    });

    it('calculates adjacent numbers correctly', () => {
      const minePositions: Position[] = [{ row: 1, col: 1 }];
      const board = createBoardWithMines(3, 3, minePositions);

      // All 8 neighbors should have count 1
      expect(board[0][0].content).toBe(1);
      expect(board[0][1].content).toBe(1);
      expect(board[0][2].content).toBe(1);
      expect(board[1][0].content).toBe(1);
      expect(board[1][2].content).toBe(1);
      expect(board[2][0].content).toBe(1);
      expect(board[2][1].content).toBe(1);
      expect(board[2][2].content).toBe(1);
    });

    it('handles adjacent mines correctly', () => {
      const minePositions: Position[] = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ];
      const board = createBoardWithMines(3, 3, minePositions);

      // Cell at (1,0) is adjacent to both mines
      expect(board[1][0].content).toBe(2);
      // Cell at (0,2) is only adjacent to mine at (0,1)
      expect(board[0][2].content).toBe(1);
      // Cell at (2,2) is not adjacent to any mine
      expect(board[2][2].content).toBe(0);
    });

    it('creates deterministic boards for testing', () => {
      const minePositions: Position[] = [
        { row: 0, col: 0 },
        { row: 2, col: 2 },
      ];

      const board1 = createBoardWithMines(3, 3, minePositions);
      const board2 = createBoardWithMines(3, 3, minePositions);

      // Both boards should be identical
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          expect(board1[row][col].content).toBe(board2[row][col].content);
        }
      }
    });
  });
});
