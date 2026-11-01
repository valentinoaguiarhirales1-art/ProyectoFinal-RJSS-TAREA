import { useEffect, useReducer } from "react";

// useReducer que guarda cada cambio de estado en localStorage.
export function usePersistedReducer(reducer, storageKey, init, onError) {
  const [state, dispatch] = useReducer(reducer, undefined, init);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error("No se pudo guardar el Sudoku en el navegador.", error);
      onError?.(error);
    }
    // Solo reaccionamos a cambios del estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, storageKey]);

  return [state, dispatch];
}
