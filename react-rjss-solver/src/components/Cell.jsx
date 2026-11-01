import { memo } from "react";

function getClassName({ isGiven, isPeer, isSame, isConflict }) {
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

function Cell({
  position,
  value,
  isGiven,
  isPeer,
  isSame,
  isConflict,
  registerRef,
  onChange,
  onSelect,
  onKeyDown,
}) {
  const row = Math.floor(position / 9);
  const column = position % 9;

  return (
    <input
      ref={(element) => registerRef(position, element)}
      className={getClassName({ isGiven, isPeer, isSame, isConflict })}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      maxLength={1}
      spellCheck={false}
      role="gridcell"
      aria-label={`Fila ${row + 1}, columna ${column + 1}`}
      aria-readonly={isGiven}
      readOnly={isGiven}
      value={value === 0 ? "" : String(value)}
      data-position={position}
      onChange={(event) => onChange(position, event.target.value)}
      onFocus={() => onSelect(position)}
      onKeyDown={(event) => onKeyDown(event, position)}
    />
  );
}

export default memo(Cell);
