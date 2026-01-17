import type { GameBoardProps } from '../types';
import { Cell } from './Cell';
import './GameBoard.css';

export function GameBoard({ grid, onCellReveal, onCellFlag }: GameBoardProps) {
  if (grid.length === 0) {
    return null;
  }

  const rows = grid.length;
  const cols = grid[0].length;

  return (
    <div
      className="game-board"
      style={{
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}
      role="grid"
      aria-label={`Minesweeper board with ${rows} rows and ${cols} columns`}
    >
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="game-board__row" role="row">
          {row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              onReveal={() => onCellReveal(rowIndex, colIndex)}
              onFlag={() => onCellFlag(rowIndex, colIndex)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
