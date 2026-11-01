const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function NumberPad({ disabled, onPick }) {
  return (
    <div className="number-pad" role="group" aria-label="Teclado numérico">
      {DIGITS.map((digit) => (
        <button
          key={digit}
          type="button"
          className="pad-key"
          disabled={disabled}
          onClick={() => onPick(digit)}
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        className="pad-key pad-erase"
        disabled={disabled}
        onClick={() => onPick(0)}
        aria-label="Borrar casilla"
      >
        ⌫
      </button>
    </div>
  );
}
