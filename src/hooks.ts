import { useState } from "react";

export function useUpdate() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setNum] = useState<number>(0);
  return {
    update: () => {
      console.log("update");
      setNum((num) => num + 1);
    },
  };
}
