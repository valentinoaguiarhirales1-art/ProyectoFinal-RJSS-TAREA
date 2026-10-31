import test from "node:test";
import assert from "node:assert/strict";
import {
  countSolutions,
  createEmptyBoard,
  generatePuzzle,
  getConflictingCells,
  solveSudoku,
  validateBoard,
} from "../src/sudoku.js";

const puzzle = [
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

const solution = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

test("validates an empty board and rejects malformed values", () => {
  assert.equal(validateBoard(createEmptyBoard()).valid, true);
  assert.equal(validateBoard([[1]]).valid, false);

  const malformed = createEmptyBoard();
  malformed[4][4] = 10;
  assert.equal(validateBoard(malformed).valid, false);
});

test("detects row, column, and box conflicts", () => {
  const board = createEmptyBoard();
  board[0][0] = 4;
  board[0][1] = 4;
  board[0][3] = 8;
  board[1][3] = 8;
  board[1][1] = 6;
  board[2][2] = 6;

  const result = validateBoard(board);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("fila 1")));
  assert.ok(result.errors.some((error) => error.includes("columna 4")));
  assert.ok(result.errors.some((error) => error.includes("cuadro 1")));
  assert.deepEqual(getConflictingCells(board), new Set([0, 1, 12, 20, 3, 10]));
});

test("solves a standard puzzle without mutating its input", () => {
  const original = puzzle.map((row) => row.slice());
  assert.deepEqual(solveSudoku(puzzle), solution);
  assert.deepEqual(puzzle, original);
  assert.equal(validateBoard(solution).valid, true);
});

test("returns null for contradictory or unsolvable puzzles", () => {
  const contradictory = puzzle.map((row) => row.slice());
  contradictory[0][2] = 5;
  assert.equal(solveSudoku(contradictory), null);

  const unsolvable = puzzle.map((row) => row.slice());
  unsolvable[0][2] = 1;
  assert.equal(validateBoard(unsolvable).valid, true);
  assert.equal(solveSudoku(unsolvable), null);
});

test("counts solutions up to a limit", () => {
  assert.equal(countSolutions(puzzle, 2), 1);
  assert.equal(countSolutions(createEmptyBoard(), 2), 2);
  assert.equal(countSolutions([[1]], 2), 0);
});

test("generates valid puzzles with a unique solution at each difficulty", () => {
  for (const difficulty of ["easy", "medium", "hard"]) {
    const generated = generatePuzzle(difficulty);
    assert.equal(validateBoard(generated.board).valid, true);
    assert.equal(validateBoard(generated.solution).valid, true);
    assert.deepEqual(solveSudoku(generated.board), generated.solution);
    assert.equal(countSolutions(generated.board, 2), 1);
    assert.ok(generated.clues >= 17 && generated.clues <= 81);
    assert.equal(
      generated.board.flat().filter((value) => value !== 0).length,
      generated.clues,
    );
  }
});

test("rejects unknown generator difficulty", () => {
  assert.throws(() => generatePuzzle("impossible"), RangeError);
});
