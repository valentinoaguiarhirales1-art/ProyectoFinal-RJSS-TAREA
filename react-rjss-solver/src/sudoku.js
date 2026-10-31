const SIZE = 9;
const BOX_SIZE = 3;
const FULL_MASK = 0b1111111110;

const DIFFICULTY_CLUES = Object.freeze({
  easy: 40,
  medium: 34,
  hard: 29,
});

export function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

export function validateBoard(board) {
  if (
    !Array.isArray(board) ||
    board.length !== SIZE ||
    board.some((row) => !Array.isArray(row) || row.length !== SIZE)
  ) {
    return {
      valid: false,
      errors: ["El tablero debe tener 9 filas y 9 columnas."],
    };
  }

  const errors = [];
  for (let row = 0; row < SIZE; row += 1) {
    for (let column = 0; column < SIZE; column += 1) {
      const value = board[row][column];
      if (!Number.isInteger(value) || value < 0 || value > 9) {
        errors.push(
          `La casilla de la fila ${row + 1}, columna ${column + 1} debe ser un dígito del 1 al 9 o estar vacía.`,
        );
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  for (let row = 0; row < SIZE; row += 1) {
    collectDuplicates(
      Array.from({ length: SIZE }, (_, column) => board[row][column]),
      `la fila ${row + 1}`,
      errors,
    );
  }

  for (let column = 0; column < SIZE; column += 1) {
    collectDuplicates(
      Array.from({ length: SIZE }, (_, row) => board[row][column]),
      `la columna ${column + 1}`,
      errors,
    );
  }

  for (let boxRow = 0; boxRow < SIZE; boxRow += BOX_SIZE) {
    for (let boxColumn = 0; boxColumn < SIZE; boxColumn += BOX_SIZE) {
      const values = [];
      for (let row = boxRow; row < boxRow + BOX_SIZE; row += 1) {
        for (
          let column = boxColumn;
          column < boxColumn + BOX_SIZE;
          column += 1
        ) {
          values.push(board[row][column]);
        }
      }
      const boxNumber =
        (boxRow / BOX_SIZE) * BOX_SIZE + boxColumn / BOX_SIZE + 1;
      collectDuplicates(values, `el cuadro ${boxNumber}`, errors);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function getConflictingCells(board) {
  const conflicts = new Set();
  if (
    !Array.isArray(board) ||
    board.length !== SIZE ||
    board.some(
      (row) =>
        !Array.isArray(row) ||
        row.length !== SIZE ||
        row.some(
          (value) => !Number.isInteger(value) || value < 0 || value > 9,
        ),
    )
  ) {
    return conflicts;
  }

  const markDuplicates = (values, indexAt) => {
    const positionsByValue = new Map();
    values.forEach((value, index) => {
      if (value === 0) {
        return;
      }
      const positions = positionsByValue.get(value) ?? [];
      positions.push(indexAt(index));
      positionsByValue.set(value, positions);
    });
    for (const positions of positionsByValue.values()) {
      if (positions.length > 1) {
        positions.forEach((position) => conflicts.add(position));
      }
    }
  };

  for (let row = 0; row < SIZE; row += 1) {
    markDuplicates(board[row], (column) => row * SIZE + column);
  }
  for (let column = 0; column < SIZE; column += 1) {
    markDuplicates(
      Array.from({ length: SIZE }, (_, row) => board[row][column]),
      (row) => row * SIZE + column,
    );
  }
  for (let boxRow = 0; boxRow < SIZE; boxRow += BOX_SIZE) {
    for (let boxColumn = 0; boxColumn < SIZE; boxColumn += BOX_SIZE) {
      const values = [];
      for (let row = boxRow; row < boxRow + BOX_SIZE; row += 1) {
        for (
          let column = boxColumn;
          column < boxColumn + BOX_SIZE;
          column += 1
        ) {
          values.push(board[row][column]);
        }
      }
      markDuplicates(values, (index) => {
        const row = boxRow + Math.floor(index / BOX_SIZE);
        const column = boxColumn + (index % BOX_SIZE);
        return row * SIZE + column;
      });
    }
  }

  return conflicts;
}

export function solveSudoku(board) {
  if (!validateBoard(board).valid) {
    return null;
  }

  const state = createSolverState(board);
  if (!search(state)) {
    return null;
  }

  return state.board.map((row) => row.slice());
}

export function countSolutions(board, limit = 2) {
  if (!Number.isInteger(limit) || limit < 1 || !validateBoard(board).valid) {
    return 0;
  }

  const state = createSolverState(board);
  let solutionCount = 0;

  const count = () => {
    if (solutionCount >= limit) {
      return;
    }

    const choice = findBestCell(state);
    if (choice.index === -1) {
      solutionCount += 1;
      return;
    }
    if (choice.candidates === 0) {
      return;
    }

    const row = Math.floor(choice.index / SIZE);
    const column = choice.index % SIZE;
    const box = getBoxIndex(row, column);

    for (let digit = 1; digit <= SIZE && solutionCount < limit; digit += 1) {
      const bit = 1 << digit;
      if ((choice.candidates & bit) === 0) {
        continue;
      }

      state.board[row][column] = digit;
      state.rowMasks[row] |= bit;
      state.columnMasks[column] |= bit;
      state.boxMasks[box] |= bit;
      count();
      state.board[row][column] = 0;
      state.rowMasks[row] &= ~bit;
      state.columnMasks[column] &= ~bit;
      state.boxMasks[box] &= ~bit;
    }
  };

  count();
  return solutionCount;
}

export function generatePuzzle(difficulty = "medium") {
  const targetClues = DIFFICULTY_CLUES[difficulty];
  if (!targetClues) {
    throw new RangeError("La dificultad debe ser easy, medium o hard.");
  }

  const solution = createRandomSolution();
  const board = solution.map((row) => row.slice());
  const positions = shuffle(
    Array.from({ length: SIZE * SIZE }, (_, index) => index),
  );
  let clues = SIZE * SIZE;

  for (const position of positions) {
    if (clues <= targetClues) {
      break;
    }

    const row = Math.floor(position / SIZE);
    const column = position % SIZE;
    const originalValue = board[row][column];
    board[row][column] = 0;

    if (countSolutions(board, 2) === 1) {
      clues -= 1;
    } else {
      board[row][column] = originalValue;
    }
  }

  return { board, solution, difficulty, clues };
}

function collectDuplicates(values, description, errors) {
  const seen = new Set();
  const duplicates = new Set();
  values.forEach((value) => {
    if (value === 0) {
      return;
    }
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  });
  duplicates.forEach((value) => {
    errors.push(`El número ${value} se repite en ${description}.`);
  });
}

function createSolverState(board) {
  const state = {
    board: board.map((row) => row.slice()),
    rowMasks: Array(SIZE).fill(0),
    columnMasks: Array(SIZE).fill(0),
    boxMasks: Array(SIZE).fill(0),
  };

  for (let row = 0; row < SIZE; row += 1) {
    for (let column = 0; column < SIZE; column += 1) {
      const value = state.board[row][column];
      if (value === 0) {
        continue;
      }
      const bit = 1 << value;
      state.rowMasks[row] |= bit;
      state.columnMasks[column] |= bit;
      state.boxMasks[getBoxIndex(row, column)] |= bit;
    }
  }

  return state;
}

function search(state) {
  const choice = findBestCell(state);
  if (choice.index === -1) {
    return true;
  }
  if (choice.candidates === 0) {
    return false;
  }

  const row = Math.floor(choice.index / SIZE);
  const column = choice.index % SIZE;
  const box = getBoxIndex(row, column);

  for (let digit = 1; digit <= SIZE; digit += 1) {
    const bit = 1 << digit;
    if ((choice.candidates & bit) === 0) {
      continue;
    }

    state.board[row][column] = digit;
    state.rowMasks[row] |= bit;
    state.columnMasks[column] |= bit;
    state.boxMasks[box] |= bit;
    if (search(state)) {
      return true;
    }
    state.board[row][column] = 0;
    state.rowMasks[row] &= ~bit;
    state.columnMasks[column] &= ~bit;
    state.boxMasks[box] &= ~bit;
  }

  return false;
}

function findBestCell(state) {
  let bestIndex = -1;
  let bestCandidates = 0;
  let fewestOptions = SIZE + 1;

  for (let index = 0; index < SIZE * SIZE; index += 1) {
    const row = Math.floor(index / SIZE);
    const column = index % SIZE;
    if (state.board[row][column] !== 0) {
      continue;
    }

    const unavailable =
      state.rowMasks[row] |
      state.columnMasks[column] |
      state.boxMasks[getBoxIndex(row, column)];
    const candidates = FULL_MASK & ~unavailable;
    const optionCount = countBits(candidates);
    if (optionCount < fewestOptions) {
      bestIndex = index;
      bestCandidates = candidates;
      fewestOptions = optionCount;
      if (optionCount <= 1) {
        break;
      }
    }
  }

  return { index: bestIndex, candidates: bestCandidates };
}

function createRandomSolution() {
  const rowOrder = shuffle([0, 1, 2]).flatMap((band) =>
    shuffle([0, 1, 2]).map((row) => band * BOX_SIZE + row),
  );
  const columnOrder = shuffle([0, 1, 2]).flatMap((stack) =>
    shuffle([0, 1, 2]).map((column) => stack * BOX_SIZE + column),
  );
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const base = (row, column) =>
    (row * BOX_SIZE + Math.floor(row / BOX_SIZE) + column) % SIZE;

  return rowOrder.map((row) =>
    columnOrder.map((column) => digits[base(row, column)]),
  );
}

function getBoxIndex(row, column) {
  return Math.floor(row / BOX_SIZE) * BOX_SIZE + Math.floor(column / BOX_SIZE);
}

function countBits(mask) {
  let count = 0;
  while (mask !== 0) {
    mask &= mask - 1;
    count += 1;
  }
  return count;
}

function shuffle(values) {
  const result = values.slice();
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
