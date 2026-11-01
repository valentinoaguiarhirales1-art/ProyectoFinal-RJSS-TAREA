import Cell from "./Cell.jsx";

const SIZE = 9;

export default function Board({
  board,
  locked,
  conflicts,
  selectedCell,
  registerRef,
  onChange,
  onSelect,
  onKeyDown,
}) {
  const selectedRow = Math.floor(selectedCell / SIZE);
  const selectedColumn = selectedCell % SIZE;
  const selectedValue =
    selectedCell < 0 ? 0 : (board[selectedRow]?.[selectedColumn] ?? 0);

  return (
    <div
      className="sudoku-board"
      role="grid"
      aria-label="Tablero de Sudoku de 9 por 9"
    >
      {board.map((row, rowIndex) => (
        <div className="board-row" role="row" key={rowIndex}>
          {row.map((value, columnIndex) => {
            const position = rowIndex * SIZE + columnIndex;
            const isPeer =
              selectedCell >= 0 &&
              position !== selectedCell &&
              (rowIndex === selectedRow ||
                columnIndex === selectedColumn ||
                (Math.floor(rowIndex / 3) === Math.floor(selectedRow / 3) &&
                  Math.floor(columnIndex / 3) ===
                    Math.floor(selectedColumn / 3)));
            return (
              <Cell
                key={position}
                position={position}
                value={value}
                isGiven={locked.includes(position)}
                isPeer={isPeer}
                isSame={value !== 0 && value === selectedValue}
                isConflict={conflicts.has(position)}
                registerRef={registerRef}
                onChange={onChange}
                onSelect={onSelect}
                onKeyDown={onKeyDown}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
