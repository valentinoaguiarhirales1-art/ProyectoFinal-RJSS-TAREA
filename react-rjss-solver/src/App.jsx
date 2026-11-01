import { useCallback, useMemo, useRef, useState } from "react";
import Board from "./components/Board.jsx";
import NumberPad from "./components/NumberPad.jsx";
import Timer, { formatTime } from "./components/Timer.jsx";
import {
  SIZE,
  createFreshState,
  gameReducer,
  getElapsedSeconds,
  withCell,
} from "./gameReducer.js";
import { usePersistedReducer } from "./hooks/usePersistedReducer.js";
import {
  generatePuzzle,
  getConflictingCells,
  solveSudoku,
  validateBoard,
} from "./sudoku.js";

const STORAGE_KEY = "sudokuklar-state-v1";
const DIFFICULTIES = ["easy", "medium", "hard"];
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
    DIFFICULTIES.includes(saved.difficulty) &&
    Number.isFinite(saved.elapsedSeconds) &&
    saved.elapsedSeconds >= 0 &&
    (saved.startedAt === null || Number.isFinite(saved.startedAt)) &&
    saved.bestTimes !== null &&
    typeof saved.bestTimes === "object" &&
    DIFFICULTIES.every(
      (difficulty) =>
        saved.bestTimes[difficulty] === null ||
        (Number.isInteger(saved.bestTimes[difficulty]) &&
          saved.bestTimes[difficulty] >= 0),
    )
  );
}

function readSavedState() {
  const fresh = (message, kind) => ({
    game: createFreshState(),
    status: { message, kind },
  });
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return fresh(
        "Escribe del 1 al 9. Deja vacías las casillas que quieras resolver.",
        "info",
      );
    }
    const saved = JSON.parse(raw);
    if (!isSavedStateValid(saved)) {
      return fresh(
        "El progreso guardado no es válido. Se abrió un tablero nuevo.",
        "error",
      );
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
    return fresh(
      "No se pudo leer el progreso guardado. Se abrió un tablero nuevo.",
      "error",
    );
  }
}

function getDifficultyLabel(difficulty) {
  return {
    easy: "Tranquilo",
    medium: "Intermedio",
    hard: "Desafiante",
  }[difficulty];
}

export default function App() {
  const [initial] = useState(readSavedState);
  const [status, setStatus] = useState(initial.status);
  const [game, dispatch] = usePersistedReducer(
    gameReducer,
    STORAGE_KEY,
    () => initial.game,
    () =>
      setStatus({
        message:
          "No se pudo guardar el progreso. Revisa el almacenamiento del navegador.",
        kind: "error",
      }),
  );
  const [selectedCell, setSelectedCell] = useState(-1);
  const cellRefs = useRef([]);

  const conflicts = useMemo(
    () => getConflictingCells(game.board),
    [game.board],
  );

  const registerRef = useCallback((position, element) => {
    cellRefs.current[position] = element;
  }, []);

  const focusCell = useCallback((position) => {
    cellRefs.current[position]?.focus();
  }, []);

  function applyValue(position, value) {
    const nextBoard = withCell(game.board, position, value);
    const validation = validateBoard(nextBoard);
    if (validation.valid && nextBoard.every((row) => row.every(Boolean))) {
      finishGame(nextBoard);
      return;
    }
    dispatch({ type: "set-cell", position, value });
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
    applyValue(position, value === "" || value === "0" ? 0 : Number(value));
  }

  function handleCellKeyDown(event, position) {
    const offsets = { ArrowUp: -SIZE, ArrowDown: SIZE };
    if (Object.hasOwn(offsets, event.key)) {
      event.preventDefault();
      focusCell(
        Math.max(0, Math.min(SIZE * SIZE - 1, position + offsets[event.key])),
      );
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const rowStart = Math.floor(position / SIZE) * SIZE;
      const rowEnd = rowStart + SIZE - 1;
      focusCell(
        event.key === "ArrowLeft"
          ? Math.max(rowStart, position - 1)
          : Math.min(rowEnd, position + 1),
      );
      return;
    }

    if (
      (event.key === "Backspace" || event.key === "Delete") &&
      !game.locked.includes(position)
    ) {
      dispatch({ type: "set-cell", position, value: 0 });
      setStatus({ message: "Casilla vacía.", kind: "info" });
    }
  }

  function handlePadPick(digit) {
    if (selectedCell < 0) {
      setStatus({
        message: "Primero elige una casilla del tablero.",
        kind: "info",
      });
      return;
    }
    if (game.locked.includes(selectedCell)) {
      setStatus({
        message: "Esa casilla es un número inicial y no se puede cambiar.",
        kind: "error",
      });
      return;
    }
    applyValue(selectedCell, digit);
    focusCell(selectedCell);
  }

  function loadPuzzle(board, difficulty) {
    dispatch({ type: "load-puzzle", board, difficulty });
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

  function getSolutionOrReport(noSolutionMessage) {
    const validation = validateBoard(game.board);
    if (!validation.valid) {
      setStatus({
        message: validation.errors.slice(0, 3).join(" "),
        kind: "error",
      });
      return null;
    }
    const solution = solveSudoku(game.board);
    if (!solution) {
      setStatus({ message: noSolutionMessage, kind: "error" });
      return null;
    }
    return solution;
  }

  function handleSolve() {
    const solution = getSolutionOrReport(
      "Este tablero no tiene solución. Revisa los números que ingresaste.",
    );
    if (!solution) {
      return;
    }

    finishGame(solution);
  }

  function finishGame(solution) {
    const solveTime = getElapsedSeconds(game);
    const previousBest = game.bestTimes[game.difficulty];
    const isNewBest = previousBest === null || solveTime < previousBest;
    dispatch({
      type: "solve",
      solution,
      elapsedSeconds: solveTime,
      bestTimes: {
        ...game.bestTimes,
        [game.difficulty]: isNewBest ? solveTime : previousBest,
      },
    });
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
    const solution = getSolutionOrReport(
      "No hay una solución posible para este tablero. Revisa tus números.",
    );
    if (!solution) {
      return;
    }

    const position = game.board.flat().findIndex((value) => value === 0);
    if (position === -1) {
      setStatus({ message: "El tablero ya está completo.", kind: "success" });
      return;
    }

    const row = Math.floor(position / SIZE);
    const column = position % SIZE;
    const nextBoard = withCell(game.board, position, solution[row][column]);
    if (nextBoard.every((boardRow) => boardRow.every(Boolean))) {
      finishGame(nextBoard);
      return;
    }
    dispatch({ type: "set-cell", position, value: solution[row][column] });
    setSelectedCell(position);
    setStatus({
      message: `Pista: fila ${row + 1}, columna ${column + 1}.`,
      kind: "success",
    });
    window.requestAnimationFrame(() => focusCell(position));
  }

  function handleClear() {
    dispatch({ type: "clear" });
    setSelectedCell(-1);
    setStatus({
      message: "Tablero limpio. Escribe un Sudoku para comenzar.",
      kind: "info",
    });
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
        <span className="topbar-note">SUDOKU · REACT JS</span>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <div className="intro-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              COMPONENTES · HOOKS · ESTADO
            </p>
            <h1 id="page-title">
              Sudoku hecho
              <br />
              <span>con React.</span>
            </h1>
            <p className="intro-description">
              Resuelve el tablero a tu ritmo o deja que el algoritmo encuentre
              la respuesta.
            </p>
          </div>
          <div className="intro-decoration" aria-hidden="true">
            <span className="react-atom">⚛</span>
          </div>
        </section>

        <section className="workspace" aria-label="Sudoku interactivo">
          <div className="board-card">
            <div className="board-heading">
              <div>
                <p className="section-kicker">&lt;Board /&gt;</p>
                <h2>Tu Sudoku</h2>
              </div>
              <Timer game={game} />
            </div>

            <Board
              board={game.board}
              locked={game.locked}
              conflicts={conflicts}
              selectedCell={selectedCell}
              registerRef={registerRef}
              onChange={handleCellChange}
              onSelect={setSelectedCell}
              onKeyDown={handleCellKeyDown}
            />

            <NumberPad disabled={selectedCell < 0} onPick={handlePadPick} />

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
              <p className="section-kicker">&lt;Controls /&gt;</p>
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
                onChange={(event) =>
                  dispatch({
                    type: "set-difficulty",
                    difficulty: event.target.value,
                  })
                }
              >
                {DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {getDifficultyLabel(difficulty)}
                  </option>
                ))}
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
              <p>Usa el tablero, el teclado o carga un reto para empezar.</p>
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
        <span>Hecho con React, hooks y componentes.</span>
        <span>
          React · <a href="./LICENSE">Licencia MIT</a>
        </span>
      </footer>
    </div>
  );
}
