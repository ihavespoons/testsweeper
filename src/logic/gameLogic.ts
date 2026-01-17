import type { Board, CellState, GameConfig, Position } from '../types';

/**
 * Creates an empty cell with default state
 */
export function createEmptyCell(): CellState {
  return {
    content: 0,
    isRevealed: false,
    isFlagged: false,
  };
}

/**
 * Creates an empty board of the specified dimensions
 */
export function createEmptyBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => createEmptyCell())
  );
}

/**
 * Checks if a position is within the board boundaries
 */
export function isValidPosition(
  row: number,
  col: number,
  rows: number,
  cols: number
): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

/**
 * Gets all valid neighboring positions for a given cell
 */
export function getNeighbors(
  row: number,
  col: number,
  rows: number,
  cols: number
): Position[] {
  const neighbors: Position[] = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1],  [1, 0], [1, 1],
  ];

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (isValidPosition(newRow, newCol, rows, cols)) {
      neighbors.push({ row: newRow, col: newCol });
    }
  }

  return neighbors;
}

/**
 * Generates random mine positions, optionally excluding a safe zone around
 * the first click position
 */
export function generateMinePositions(
  rows: number,
  cols: number,
  mineCount: number,
  excludePosition?: Position
): Position[] {
  const totalCells = rows * cols;

  // Build set of excluded positions (first click and its neighbors)
  const excludedSet = new Set<string>();
  if (excludePosition) {
    excludedSet.add(`${excludePosition.row},${excludePosition.col}`);
    const neighbors = getNeighbors(excludePosition.row, excludePosition.col, rows, cols);
    for (const neighbor of neighbors) {
      excludedSet.add(`${neighbor.row},${neighbor.col}`);
    }
  }

  const availableCells = totalCells - excludedSet.size;
  const actualMineCount = Math.min(mineCount, availableCells);

  // Generate all possible positions
  const allPositions: Position[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!excludedSet.has(`${row},${col}`)) {
        allPositions.push({ row, col });
      }
    }
  }

  // Fisher-Yates shuffle and take first N positions
  for (let i = allPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }

  return allPositions.slice(0, actualMineCount);
}

/**
 * Places mines on the board at the specified positions
 */
export function placeMines(board: Board, minePositions: Position[]): Board {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  for (const { row, col } of minePositions) {
    newBoard[row][col].content = 'mine';
  }

  return newBoard;
}

/**
 * Counts the number of adjacent mines for a given cell
 */
export function countAdjacentMines(board: Board, row: number, col: number): number {
  const rows = board.length;
  if (rows === 0) return 0;
  const cols = board[0].length;
  if (cols === 0) return 0;

  // Validate position is within bounds
  if (!isValidPosition(row, col, rows, cols)) return 0;

  const neighbors = getNeighbors(row, col, rows, cols);

  return neighbors.filter(
    ({ row: r, col: c }) => board[r][c].content === 'mine'
  ).length;
}

/**
 * Calculates and sets the adjacent mine count for all non-mine cells
 */
export function calculateNumbers(board: Board): Board {
  const rows = board.length;
  if (rows === 0) return [];
  const cols = board[0].length;
  if (cols === 0) return board.map(() => []);

  const newBoard = board.map(row => row.map(cell => ({ ...cell })));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (newBoard[row][col].content !== 'mine') {
        newBoard[row][col].content = countAdjacentMines(board, row, col);
      }
    }
  }

  return newBoard;
}

/**
 * Creates a fully initialized board with mines placed and numbers calculated
 */
export function createBoard(config: GameConfig, excludePosition?: Position): Board {
  const { rows, cols, mineCount } = config;

  let board = createEmptyBoard(rows, cols);
  const minePositions = generateMinePositions(rows, cols, mineCount, excludePosition);
  board = placeMines(board, minePositions);
  board = calculateNumbers(board);

  return board;
}

/**
 * Creates a board with mines placed at specific positions (useful for testing)
 */
export function createBoardWithMines(
  rows: number,
  cols: number,
  minePositions: Position[]
): Board {
  let board = createEmptyBoard(rows, cols);
  board = placeMines(board, minePositions);
  board = calculateNumbers(board);
  return board;
}
