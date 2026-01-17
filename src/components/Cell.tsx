import type { CellProps } from '../types';
import './Cell.css';

export function Cell({ cell, onReveal, onFlag }: CellProps) {
  const { content, isRevealed, isFlagged } = cell;

  const handleClick = () => {
    if (!isRevealed && !isFlagged) {
      onReveal();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isRevealed) {
      onFlag();
    }
  };

  const getCellContent = (): string => {
    if (isFlagged) {
      return '🚩';
    }
    if (!isRevealed) {
      return '';
    }
    if (content === 'mine') {
      return '💣';
    }
    if (content === 0) {
      return '';
    }
    return String(content);
  };

  const getClassName = (): string => {
    const classes = ['cell'];

    if (isRevealed) {
      classes.push('cell--revealed');
      if (content === 'mine') {
        classes.push('cell--mine');
      } else if (typeof content === 'number' && content > 0) {
        classes.push(`cell--number-${content}`);
      }
    } else {
      classes.push('cell--hidden');
      if (isFlagged) {
        classes.push('cell--flagged');
      }
    }

    return classes.join(' ');
  };

  return (
    <button
      className={getClassName()}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      type="button"
      aria-label={
        isFlagged
          ? 'Flagged cell'
          : isRevealed
            ? content === 'mine'
              ? 'Mine'
              : `${content} adjacent mines`
            : 'Hidden cell'
      }
      data-testid="cell"
    >
      {getCellContent()}
    </button>
  );
}
