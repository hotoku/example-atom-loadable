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

export function loadRoot(): Promise<Item[]> {
  const loadingItems = new Promise((resolve) => setTimeout(resolve, 1000)).then(
    () => {
      const items = Object.values(db).filter((item) => item.parent === null);
      return items;
    }
  );
  return loadingItems;
}

export function loadChildren(parent: number): Promise<Item[]> {
  const loadingItems = new Promise((resolve) => setTimeout(resolve, 1000)).then(
    () => {
      const items = Object.values(db).filter((item) => item.parent === parent);
      return items;
    }
  );

  return loadingItems;
}

export function updateName(id: number, v: string): Promise<string> {
  const updating = new Promise((resolve) => setTimeout(resolve, 1000)).then(
    () => {
      const item = Object.values(db).find((item) => item.id === id);
      if (item === undefined) {
        throw new Error("Item not found");
      }
      item.name = v;
      return v;
    }
  );
  return updating;
}
