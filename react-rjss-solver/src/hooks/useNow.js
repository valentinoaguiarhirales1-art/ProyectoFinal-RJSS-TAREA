import { useEffect, useState } from "react";

// Devuelve Date.now() actualizado cada segundo mientras `active` sea true.
export function useNow(active = true) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    setNow(Date.now());
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [active]);

  return now;
}
