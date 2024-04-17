import { Suspense, useEffect, useState } from "react";
import "./App.css";
import { getRoot } from "./api";
import Loadable from "./loadable";
import { RootNode, ValueNode } from "./model";

function useItems(n: number) {
  const [items, setItems] = useState<Loadable<RootNode> | null>(null);

  useEffect(() => {
    console.log("useEffect");
    new Promise((resolve) => setTimeout(resolve, n * 1000)).then(() => {
      setItems(new Loadable(getRoot()));
    });
  }, [n]);

  return items;
}

function TreeNode({
  nodeLoadable,
}: {
  nodeLoadable: Loadable<ValueNode>;
}): JSX.Element {
  const node = nodeLoadable.getOrThrow();
  return (
    <div>
      <div>{node.name}</div>
      {node.children !== null ? (
        <TreeArray nodeLoadables={node.children} />
      ) : null}
    </div>
  );
}

function TreeArray({
  nodeLoadables,
}: {
  nodeLoadables: Loadable<Loadable<ValueNode>[]>;
}): JSX.Element {
  const nodes = nodeLoadables.getOrThrow();
  return (
    <div>
      {nodes.map((n) => (
        <TreeNode nodeLoadable={n} />
      ))}
    </div>
  );
}

function TreeRoot({ nodeLoadable }: { nodeLoadable: Loadable<RootNode> }) {
  const node = nodeLoadable.getOrThrow();
  if (node.children === null) {
    throw new Error("panic");
  }
  return (
    <div>
      <div>{"root"}</div>
      <Suspense fallback={<div>Loading...</div>}>
        <TreeArray nodeLoadables={node.children} />
      </Suspense>
    </div>
  );
}

function App() {
  const items = useItems(1);

  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        {items ? (
          <TreeRoot nodeLoadable={items} />
        ) : (
          <div>before loading...</div>
        )}
      </Suspense>
    </>
  );
}

export default App;
