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
