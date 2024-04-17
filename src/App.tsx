import { Suspense, useEffect, useState } from "react";
import "./App.css";
import { Item, getRoot } from "./api";
import Loadable from "./loadable";

function useItems(n: number) {
  const [items, setItems] = useState<Loadable<Item[]> | null>(null);

  useEffect(() => {
    console.log("useEffect");
    new Promise((resolve) => setTimeout(resolve, n * 1000)).then(() => {
      setItems(new Loadable(getRoot()));
    });
  }, [n]);

  return items;
}

type ItemListProps = {
  items: Loadable<Item[]>;
};
function ItemList({ items }: ItemListProps): JSX.Element {
  const handleClick = () => {
    console.log("clicked");
  };

  return (
    <div>
      <ul>
        {items.getOrThrow().map((i) => (
          <li key={i.id}>
            {i.name}
            <button onClick={handleClick}>show child</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const items = useItems(1);

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        {items ? <ItemList items={items} /> : <div>before loading...</div>}
      </Suspense>
    </>
  );
}

export default App;
