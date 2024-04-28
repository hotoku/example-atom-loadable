import { useState } from "react";

export function useUpdate() {
  const [num, setNum] = useState(0);
  const update = () => setNum((prev) => prev + 1);
  return { num, update };
}
