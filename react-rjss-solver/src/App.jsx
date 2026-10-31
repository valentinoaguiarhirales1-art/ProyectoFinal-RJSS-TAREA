import { useEffect, useMemo, useRef, useState } from "react";
import {
  createEmptyBoard,
  generatePuzzle,
  getConflictingCells,
  solveSudoku,
  validateBoard,
} from "./sudoku.js";

const STORAGE_KEY = "sudokuklar-state-v1";
const SIZE = 9;
const DEFAULT_BEST_TIMES = Object.freeze({
  easy: null,
  medium: null,
  hard: null,
});
const EXAMPLE_BOARD = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

function createFreshState() {
  return {
    board: createEmptyBoard(),
    locked: [],
    difficulty: "medium",
    elapsedSeconds: 0,
    startedAt: null,
    bestTimes: { ...DEFAULT_BEST_TIMES },
  };
}

function isSavedStateValid(saved) {
  return (
    saved !== null &&
    typeof saved === "object" &&
    Array.isArray(saved.board) &&
    saved.board.length === SIZE &&
    saved.board.every(
      (row) =>
        Array.isArray(row) &&
        row.length === SIZE &&
        row.every(
          (value) => Number.isInteger(value) && value >= 0 && value <= 9,
        ),
    ) &&
    Array.isArray(saved.locked) &&
    saved.locked.every(
      (position) =>
        Number.isInteger(position) && position >= 0 && position < SIZE * SIZE,
    ) &&
    ["easy", "medium", "hard"].includes(saved.difficulty) &&
    Number.isFinite(saved.elapsedSeconds) &&
    saved.elapsedSeconds >= 0 &&
    (saved.startedAt === null || Number.isFinite(saved.startedAt)) &&
    saved.bestTimes !== null &&
    typeof saved.bestTimes === "object" &&
    ["easy", "medium", "hard"].every(
      (difficulty) =>
        saved.bestTimes[difficulty] === null ||
        (Number.isInteger(saved.bestTimes[difficulty]) &&
          saved.bestTimes[difficulty] >= 0),
    )
  );
}

function readSavedState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return {
        game: createFreshState(),
        status: {
          message:
            "Escribe del 1 al 9. Deja vacías las casillas que quieras resolver.",
          kind: "info",
        },
      };
    }

    const saved = JSON.parse(raw);
    if (!isSavedStateValid(saved)) {
      return {
        game: createFreshState(),
        status: {
          message: "El progreso guardado no es válido. Se abrió un tablero nuevo.",
          kind: "error",
        },
      };
    }

    return {
      game: saved,
      status: {
        message: "Tu progreso anterior está listo. ¡Continúa cuando quieras!",
        kind: "info",
      },
    };
  } catch (error) {
    console.error("No se pudo leer el Sudoku guardado.", error);
    return {
      game: createFreshState(),
      status: {
        message:
          "No se pudo leer el progreso guardado. Se abrió un tablero nuevo.",
        kind: "error",
      },
    };
  }
}

function getFilledPositions(board) {
  const positions = [];
  board.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value !== 0) {
        positions.push(rowIndex * SIZE + columnIndex);
      }
    });
  });
  return positions;
}

function getElapsedSeconds(game) {
  return (
    game.elapsedSeconds +
    (game.startedAt === null
      ? 0
      : Math.floor((Date.now() - game.startedAt) / 1000))
  );
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getDifficultyLabel(difficulty) {
  return {
    easy: "Tranquilo",
    medium: "Intermedio",
    hard: "Desafiante",
  }[difficulty];
}

function getCellClassName({
  isGiven,
  isPeer,
  isSame,
  isConflict,
}) {
  return [
    "cell",
    isGiven && "is-given",
    isPeer && "is-peer",
    isSame && "is-same",
    isConflict && "is-conflict",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function App() {
  const [initial] = useState(readSavedState);
  const [game, setGame] = useState(initial.game);
  const [status, setStatus] = useState(initial.status);
  const [selectedCell, setSelectedCell] = useState(-1);
  const [, setClockTick] = useState(0);
  const cellRefs = useRef([]);

  const conflicts = useMemo(
    () => getConflictingCells(game.board),
    [game.board],
  );
  const selectedRow = Math.floor(selectedCell / SIZE);
  const selectedColumn = selectedCell % SIZE;
  const selectedValue =
    selectedCell < 0
      ? 0
      : (game.board[selectedRow]?.[selectedColumn] ?? 0);
  const elapsedSeconds = getElapsedSeconds(game);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockTick((tick) => tick + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } catch (error) {
      console.error("No se pudo guardar el Sudoku en el navegador.", error);
      setStatus({
        message:
          "No se pudo guardar el progreso. Revisa el almacenamiento del navegador.",
        kind: "error",
      });
    }
  }, [game]);

  function updateCell(position, value) {
    const row = Math.floor(position / SIZE);
    const column = position % SIZE;
    setGame((current) => ({
      ...current,
      board: current.board.map((boardRow, rowIndex) =>
        rowIndex === row
          ? boardRow.map((cell, columnIndex) =>
              columnIndex === column ? value : cell,
            )
          : boardRow,
      ),
      startedAt:
        value !== 0 && current.startedAt === null
          ? Date.now()
          : current.startedAt,
    }));
  }

  function handleCellChange(position, rawValue) {
    if (game.locked.includes(position)) {
      return;
    }
    const value = rawValue.trim();
    if (!/^[0-9]?$/.test(value)) {
      setStatus({
        message:
          "Usa solo dígitos del 1 al 9; el 0 o una casilla vacía representan un espacio.",
        kind: "error",
      });
      return;
    }

    updateCell(position, value === "" || value === "0" ? 0 : Number(value));
    const nextBoard = game.board.map((row) => row.slice());
    const row = Math.floor(position / SIZE);
    const column = position % SIZE;
    nextBoard[row][column] =
      value === "" || value === "0" ? 0 : Number(value);
    const validation = validateBoard(nextBoard);
    setStatus(
      validation.valid
        ? {
            message:
              "Sin conflictos por ahora. Puedes seguir completando el tablero.",
            kind: "success",
          }
        : {
            message: `Hay conflictos: ${validation.errors[0]}`,
            kind: "error",
          },
    );
  }

  function handleCellKeyDown(event, position) {
    const offsets = {
      ArrowUp: -SIZE,
      ArrowDown: SIZE,
    };
    if (Object.hasOwn(offsets, event.key)) {
      event.preventDefault();
      const nextPosition = Math.max(
        0,
        Math.min(SIZE * SIZE - 1, position + offsets[event.key]),
      );
      cellRefs.current[nextPosition]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const rowStart = Math.floor(position / SIZE) * SIZE;
      const rowEnd = rowStart + SIZE - 1;
      const nextPosition =
        event.key === "ArrowLeft"
          ? Math.max(rowStart, position - 1)
          : Math.min(rowEnd, position + 1);
      cellRefs.current[nextPosition]?.focus();
      return;
    }

    if (
      (event.key === "Backspace" || event.key === "Delete") &&
      !game.locked.includes(position)
    ) {
      updateCell(position, 0);
      setStatus({ message: "Casilla vacía.", kind: "info" });
    }
  }

  function loadPuzzle(board, difficulty) {
    setGame((current) => ({
      board: board.map((row) => row.slice()),
      locked: getFilledPositions(board),
      difficulty,
      elapsedSeconds: 0,
      startedAt: Date.now(),
      bestTimes: current.bestTimes,
    }));
    setSelectedCell(-1);
  }

  function handleNewGame() {
    setStatus({
      message: "Preparando un Sudoku con solución única…",
      kind: "info",
    });
    window.setTimeout(() => {
      try {
        const puzzle = generatePuzzle(game.difficulty);
        loadPuzzle(puzzle.board, puzzle.difficulty);
        setStatus({
          message: `Sudoku ${getDifficultyLabel(
            puzzle.difficulty,
          ).toLowerCase()} listo con ${puzzle.clues} pistas. ¡A jugar!`,
          kind: "success",
        });
      } catch (error) {
        console.error("No se pudo generar el Sudoku.", error);
        setStatus({
          message: "No se pudo generar el Sudoku. Inténtalo de nuevo.",
          kind: "error",
        });
      }
    }, 20);
  }

  function handleSolve() {
    const validation = validateBoard(game.board);
    if (!validation.valid) {
      setStatus({
        message: validation.errors.slice(0, 3).join(" "),
        kind: "error",
      });
      return;
    }

    const solution = solveSudoku(game.board);
    if (!solution) {
      setStatus({
        message:
          "Este tablero no tiene solución. Revisa los números que ingresaste.",
        kind: "error",
      });
      return;
    }

    const solveTime = elapsedSeconds;
    const previousBest = game.bestTimes[game.difficulty];
    const isNewBest = previousBest === null || solveTime < previousBest;
    const bestTimes = {
      ...game.bestTimes,
      [game.difficulty]: isNewBest ? solveTime : previousBest,
    };
    setGame((current) => ({
      ...current,
      board: solution,
      elapsedSeconds: solveTime,
      startedAt: null,
      bestTimes,
    }));
    setStatus({
      message: isNewBest
        ? `¡Sudoku resuelto en ${formatTime(
            solveTime,
          )}! ¡Es tu mejor tiempo para esta dificultad!`
        : `¡Sudoku resuelto en ${formatTime(
            solveTime,
          )}! Tu mejor tiempo es ${formatTime(previousBest)}.`,
      kind: "success",
    });
  }

  function handleHint() {
    const validation = validateBoard(game.board);
    if (!validation.valid) {
      setStatus({
        message: validation.errors.slice(0, 3).join(" "),
        kind: "error",
      });
      return;
    }

    const solution = solveSudoku(game.board);
    if (!solution) {
      setStatus({
        message:
          "No hay una solución posible para este tablero. Revisa tus números.",
        kind: "error",
      });
      return;
    }

    const position = game.board
      .flat()
      .findIndex((value) => value === 0);
    if (position === -1) {
      setStatus({ message: "El tablero ya está completo.", kind: "success" });
      return;
    }

    const row = Math.floor(position / SIZE);
    const column = position % SIZE;
    const nextBoard = game.board.map((boardRow) => boardRow.slice());
    nextBoard[row][column] = solution[row][column];
    setGame((current) => ({
      ...current,
      board: nextBoard,
      startedAt: current.startedAt === null ? Date.now() : current.startedAt,
    }));
    setSelectedCell(position);
    setStatus({
      message: `Pista: fila ${row + 1}, columna ${column + 1}.`,
      kind: "success",
    });
    window.requestAnimationFrame(() => cellRefs.current[position]?.focus());
  }

  function handleClear() {
    setGame((current) => ({
      ...createFreshState(),
      difficulty: current.difficulty,
      bestTimes: current.bestTimes,
    }));
    setSelectedCell(-1);
    setStatus({ message: "Tablero limpio. Escribe un Sudoku para comenzar." });
  }

  function handleDifficultyChange(event) {
    setGame((current) => ({ ...current, difficulty: event.target.value }));
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="SudoKlar, inicio">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>
            Sudo<span className="brand-accent">Klar</span>
          </span>
        </a>
        <span className="topbar-note">UN CLÁSICO, RESUELTO CON LÓGICA</span>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              TU ESPACIO DE SUDOKU
            </p>
            <h1 id="page-title">
              Un poco de lógica.
              <br />
              <span>Mucho de calma.</span>
            </h1>
            <p className="intro-description">
              Resuelve el tablero a tu ritmo o deja que el algoritmo encuentre
              la respuesta.
            </p>
          </div>
          <div className="intro-decoration" aria-hidden="true">
            <span>9</span>
            <span>·</span>
            <span>3</span>
            <span>·</span>
            <span>1</span>
          </div>
        </section>

        <section className="workspace" aria-label="Sudoku interactivo">
          <div className="board-card">
            <div className="board-heading">
              <div>
                <p className="section-kicker">EL TABLERO</p>
                <h2>Tu Sudoku</h2>
              </div>
              <div className="timer" aria-label="Tiempo de juego">
                <span className="timer-icon" aria-hidden="true" />
                <span role="timer">{formatTime(elapsedSeconds)}</span>
              </div>
            </div>

            <div
              className="sudoku-board"
              role="grid"
              aria-label="Tablero de Sudoku de 9 por 9"
            >
              {game.board.map((row, rowIndex) => (
                <div className="board-row" role="row" key={rowIndex}>
                  {row.map((value, columnIndex) => {
                    const position = rowIndex * SIZE + columnIndex;
                    const isGiven = game.locked.includes(position);
                    const isPeer =
                      selectedCell >= 0 &&
                      position !== selectedCell &&
                      (rowIndex === selectedRow ||
                        columnIndex === selectedColumn ||
                        (Math.floor(rowIndex / 3) ===
                          Math.floor(selectedRow / 3) &&
                          Math.floor(columnIndex / 3) ===
                            Math.floor(selectedColumn / 3)));
                    return (
                      <input
                        key={position}
                        ref={(element) => {
                          cellRefs.current[position] = element;
                        }}
                        className={getCellClassName({
                          isGiven,
                          isPeer,
                          isSame: value !== 0 && value === selectedValue,
                          isConflict: conflicts.has(position),
                        })}
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={1}
                        spellCheck={false}
                        role="gridcell"
                        aria-label={`Fila ${rowIndex + 1}, columna ${
                          columnIndex + 1
                        }`}
                        aria-readonly={isGiven}
                        readOnly={isGiven}
                        value={value === 0 ? "" : String(value)}
                        data-position={position}
                        onChange={(event) =>
                          handleCellChange(position, event.target.value)
                        }
                        onFocus={() => setSelectedCell(position)}
                        onKeyDown={(event) =>
                          handleCellKeyDown(event, position)
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="board-legend" aria-label="Leyenda del tablero">
              <span>
                <i className="legend-dot legend-given" />
                Número inicial
              </span>
              <span>
                <i className="legend-dot legend-entry" />
                Tu respuesta
              </span>
            </div>
          </div>

          <aside className="control-card" aria-labelledby="controls-title">
            <div className="control-heading">
              <p className="section-kicker">A TU MANERA</p>
              <h2 id="controls-title">¿Qué hacemos?</h2>
              <p>Ingresa un tablero, practica o genera un reto nuevo.</p>
            </div>

            <label className="field-label" htmlFor="difficulty">
              Dificultad del nuevo Sudoku
            </label>
            <div className="select-wrap">
              <select
                id="difficulty"
                name="difficulty"
                value={game.difficulty}
                onChange={handleDifficultyChange}
              >
                <option value="easy">Tranquilo</option>
                <option value="medium">Intermedio</option>
                <option value="hard">Desafiante</option>
              </select>
              <span className="select-chevron" aria-hidden="true" />
            </div>

            <button
              className="button button-primary"
              type="button"
              onClick={handleNewGame}
            >
              <span className="button-symbol" aria-hidden="true">
                ＋
              </span>
              Nuevo Sudoku
            </button>
            <div className="button-row">
              <button
                className="button button-dark"
                type="button"
                onClick={handleSolve}
              >
                Resolver
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={handleHint}
              >
                Dar pista
              </button>
            </div>
            <div className="button-row button-row-last">
              <button
                className="button button-quiet"
                type="button"
                onClick={() => {
                  loadPuzzle(EXAMPLE_BOARD, "medium");
                  setStatus({
                    message:
                      "Ejemplo cargado. Completa las casillas vacías o resuélvelo.",
                    kind: "success",
                  });
                }}
              >
                Cargar ejemplo
              </button>
              <button
                className="button button-quiet"
                type="button"
                onClick={handleClear}
              >
                Limpiar
              </button>
            </div>

            <div className="status-panel" data-kind={status.kind ?? "info"}>
              <span className="status-indicator" aria-hidden="true" />
              <p role="status" aria-live="polite">
                {status.message}
              </p>
            </div>

            <div className="rules-note">
              <span className="rules-mark" aria-hidden="true">
                i
              </span>
              <p>Un número por fila, columna y cada cuadro de 3 × 3.</p>
            </div>
          </aside>
        </section>

        <section className="how-it-works" aria-label="Cómo funciona">
          <div className="feature">
            <span className="feature-number">01</span>
            <div>
              <h3>Completa</h3>
              <p>Usa el tablero o carga un reto para empezar.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-number">02</span>
            <div>
              <h3>Comprueba</h3>
              <p>Los conflictos se señalan al instante.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-number">03</span>
            <div>
              <h3>Resuelve</h3>
              <p>Backtracking encuentra una solución válida.</p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <span>Hecho para pensar con calma.</span>
        <span>
          React · <a href="./LICENSE">Licencia MIT</a>
        </span>
      </footer>
    </div>
  );
}
