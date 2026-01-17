export type CellContent = 'mine' | number; // number represents adjacent mine count (0-8)

export interface CellState {
  content: CellContent;
  isRevealed: boolean;
  isFlagged: boolean;
}

export interface CellProps {
  cell: CellState;
  onReveal: () => void;
  onFlag: () => void;
}

export interface GameBoardProps {
  grid: CellState[][];
  onCellReveal: (row: number, col: number) => void;
  onCellFlag: (row: number, col: number) => void;
}

export type Board = CellState[][];

export interface GameConfig {
  rows: number;
  cols: number;
  mineCount: number;
}

export interface Position {
  row: number;
  col: number;
}

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';
