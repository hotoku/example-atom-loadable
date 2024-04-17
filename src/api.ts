import { RootNode } from "./model";

export type Item = {
  id: number;
  name: string;
  parent: number | null;
};

const db: {
  [key: number]: { id: number; name: string; parent: number | null };
} = {
  1: { id: 1, name: "one", parent: null },
  2: { id: 2, name: "two", parent: 1 },
  3: { id: 3, name: "three", parent: 1 },
  4: { id: 4, name: "four", parent: 2 },
};

export function getRoot(): Promise<RootNode> {
  const loadingItems = new Promise((resolve) => setTimeout(resolve, 1000)).then(
    () => {
      const items = Object.values(db).filter((item) => item.parent === null);
      return items;
    }
  );

  return RootNode.create(loadingItems);
}
