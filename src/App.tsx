import { useState, useCallback } from 'react';
import { GameBoard } from './components/GameBoard';
import {
  createEmptyBoard,
  createBoard,
  revealCell,
  revealAllMines,
  toggleFlag,
  checkGameWon,
  checkGameLost,
  countFlags,
} from './logic/gameLogic';
import type { Board, GameConfig, GameStatus } from './types';
import './App.css';

const DEFAULT_CONFIG: GameConfig = {
  rows: 9,
  cols: 9,
  mineCount: 10,
};

function App() {
  const [config] = useState<GameConfig>(DEFAULT_CONFIG);
  const [board, setBoard] = useState<Board>(() => createEmptyBoard(config.rows, config.cols));
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [isFirstClick, setIsFirstClick] = useState(true);

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard(config.rows, config.cols));
    setGameStatus('idle');
    setIsFirstClick(true);
  }, [config]);

  const handleCellReveal = useCallback(
    (row: number, col: number) => {
      // Don't allow moves if game is over
      if (gameStatus === 'won' || gameStatus === 'lost') {
        return;
      }

      let newBoard: Board;

      if (isFirstClick) {
        // On first click, generate the board with mines, excluding click position
        newBoard = createBoard(config, { row, col });
        newBoard = revealCell(newBoard, row, col);
        setIsFirstClick(false);
        setGameStatus('playing');
      } else {
        newBoard = revealCell(board, row, col);
      }

      // Check for game over conditions
      if (checkGameLost(newBoard)) {
        newBoard = revealAllMines(newBoard);
        setGameStatus('lost');
      } else if (checkGameWon(newBoard)) {
        setGameStatus('won');
      }

      setBoard(newBoard);
    },
    [board, config, gameStatus, isFirstClick]
  );

  const handleCellFlag = useCallback(
    (row: number, col: number) => {
      // Don't allow flags if game is over or hasn't started
      if (gameStatus === 'won' || gameStatus === 'lost' || gameStatus === 'idle') {
        return;
      }

      const newBoard = toggleFlag(board, row, col);
      setBoard(newBoard);
    },
    [board, gameStatus]
  );

  const flagCount = countFlags(board);
  const minesRemaining = config.mineCount - flagCount;

  return (
    <div className="app">
      <h1>Minesweeper</h1>
      <div className="game-info">
        <div className="mines-counter">Mines: {minesRemaining}</div>
        <button className="reset-button" onClick={resetGame}>
          {gameStatus === 'won' ? '😎' : gameStatus === 'lost' ? '😵' : '🙂'}
        </button>
        <div className="game-status">
          {gameStatus === 'won' && 'You Win!'}
          {gameStatus === 'lost' && 'Game Over!'}
          {gameStatus === 'idle' && 'Click to start'}
          {gameStatus === 'playing' && 'Playing...'}
        </div>
      </div>
      <GameBoard
        grid={board}
        onCellReveal={handleCellReveal}
        onCellFlag={handleCellFlag}
      />
    </div>
  );
}

export default App;
