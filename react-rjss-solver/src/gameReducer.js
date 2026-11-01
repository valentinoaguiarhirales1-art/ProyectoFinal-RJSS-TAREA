import { createEmptyBoard } from "./sudoku.js";

export const SIZE = 9;

const DEFAULT_BEST_TIMES = Object.freeze({
  easy: null,
  medium: null,
  hard: null,
});

export function createFreshState() {
  return {
    board: createEmptyBoard(),
    locked: [],
    difficulty: "medium",
    elapsedSeconds: 0,
    startedAt: null,
    bestTimes: { ...DEFAULT_BEST_TIMES },
  };
}

export function getFilledPositions(board) {
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

export function getElapsedSeconds(game, now = Date.now()) {
  return (
    game.elapsedSeconds +
    (game.startedAt === null ? 0 : Math.floor((now - game.startedAt) / 1000))
  );
}

export function withCell(board, position, value) {
  const row = Math.floor(position / SIZE);
  const column = position % SIZE;
  return board.map((boardRow, rowIndex) =>
    rowIndex === row
      ? boardRow.map((cell, columnIndex) =>
          columnIndex === column ? value : cell,
        )
      : boardRow,
  );
}

export function gameReducer(game, action) {
  switch (action.type) {
    case "set-cell":
      return {
        ...game,
        board: withCell(game.board, action.position, action.value),
        startedAt:
          action.value !== 0 && game.startedAt === null
            ? Date.now()
            : game.startedAt,
      };
    case "load-puzzle":
      return {
        board: action.board.map((row) => row.slice()),
        locked: getFilledPositions(action.board),
        difficulty: action.difficulty,
        elapsedSeconds: 0,
        startedAt: Date.now(),
        bestTimes: game.bestTimes,
      };
    case "set-difficulty":
      return { ...game, difficulty: action.difficulty };
    case "clear":
      return {
        ...createFreshState(),
        difficulty: game.difficulty,
        bestTimes: game.bestTimes,
      };
    case "solve":
      return {
        ...game,
        board: action.solution,
        elapsedSeconds: action.elapsedSeconds,
        startedAt: null,
        bestTimes: action.bestTimes,
      };
    default:
      return game;
  }
}
