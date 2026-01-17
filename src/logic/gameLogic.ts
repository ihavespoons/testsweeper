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

/**
 * Checks if the game is lost (a mine has been revealed)
 */
export function checkGameLost(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (cell.content === 'mine' && cell.isRevealed) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if the game is won (all non-mine cells are revealed)
 */
export function checkGameWon(board: Board): boolean {
  for (const row of board) {
    for (const cell of row) {
      // If there's a non-mine cell that's not revealed, game is not won
      if (cell.content !== 'mine' && !cell.isRevealed) {
        return false;
      }
    }
  }
  // All non-mine cells are revealed, and at least one cell exists
  return board.length > 0 && board[0].length > 0;
}

/**
 * Reveals a single cell on the board. Returns a new board with the cell revealed.
 * If the cell has 0 adjacent mines, recursively reveals all adjacent cells (flood-fill).
 */
export function revealCell(board: Board, row: number, col: number): Board {
  const rows = board.length;
  if (rows === 0) return board;
  const cols = board[0].length;
  if (cols === 0) return board;

  // Validate position
  if (!isValidPosition(row, col, rows, cols)) return board;

  // Can't reveal flagged or already revealed cells
  if (board[row][col].isFlagged || board[row][col].isRevealed) {
    return board;
  }

  // Create a new board with the cell revealed
  const newBoard = board.map(r => r.map(cell => ({ ...cell })));
  newBoard[row][col].isRevealed = true;

  // If it's a mine or has adjacent mines, just return the revealed board
  if (newBoard[row][col].content === 'mine' || newBoard[row][col].content > 0) {
    return newBoard;
  }

  // Flood-fill: if it's a zero cell, reveal all adjacent cells
  const neighbors = getNeighbors(row, col, rows, cols);
  let resultBoard = newBoard;
  for (const neighbor of neighbors) {
    resultBoard = revealCell(resultBoard, neighbor.row, neighbor.col);
  }

  return resultBoard;
}

/**
 * Reveals all mines on the board (used when game is lost)
 */
export function revealAllMines(board: Board): Board {
  return board.map(row =>
    row.map(cell => ({
      ...cell,
      isRevealed: cell.content === 'mine' ? true : cell.isRevealed,
    }))
  );
}

/**
 * Toggles the flag state on a cell. Returns a new board.
 * Can only flag cells that are not revealed.
 */
export function toggleFlag(board: Board, row: number, col: number): Board {
  const rows = board.length;
  if (rows === 0) return board;
  const cols = board[0].length;
  if (cols === 0) return board;

  // Validate position
  if (!isValidPosition(row, col, rows, cols)) return board;

  // Can't flag revealed cells
  if (board[row][col].isRevealed) {
    return board;
  }

  const newBoard = board.map(r => r.map(cell => ({ ...cell })));
  newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
  return newBoard;
}

/**
 * Counts the number of flags placed on the board
 */
export function countFlags(board: Board): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.isFlagged) {
        count++;
      }
    }
  }
  return count;
}
