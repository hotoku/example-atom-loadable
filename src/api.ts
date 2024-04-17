import Loadable from "./loadable";

export type Item = {
  id: number;
  name: string;
  children: Loadable<Item>[] | null;
  parent: number | null;
};

const db: { [key: number]: Item } = {
  1: { id: 1, name: "one", children: null, parent: null },
  2: { id: 2, name: "two", children: null, parent: 1 },
  3: { id: 3, name: "three", children: null, parent: 1 },
  4: { id: 4, name: "four", children: null, parent: 2 },
};

export async function getRoot(): Promise<Item[]> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return Object.values(db).filter((item) => item.parent === null);
}

export async function getItem(id: number): Promise<Item> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return db[id];
}
