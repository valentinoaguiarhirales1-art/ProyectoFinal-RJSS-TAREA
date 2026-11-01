import { getElapsedSeconds } from "../gameReducer.js";
import { useNow } from "../hooks/useNow.js";

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Solo este componente se re-renderiza cada segundo, no todo el tablero.
export default function Timer({ game }) {
  const now = useNow(game.startedAt !== null);
  return (
    <div className="timer" aria-label="Tiempo de juego">
      <span className="timer-icon" aria-hidden="true" />
      <span role="timer">{formatTime(getElapsedSeconds(game, now))}</span>
    </div>
  );
}
