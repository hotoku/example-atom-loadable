import { Suspense, useEffect, useState } from "react";
import "./App.css";
import { getRoot } from "./api";
import { Loadable, LoadableWithAttr } from "./loadable";
import { RootNode, ValueNode } from "./model";

function useItems() {
  const [items, setItems] = useState<Loadable<RootNode> | null>(null);

  useEffect(() => {
    new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
      setItems(new Loadable(getRoot()));
    });
  }, []);

  return items;
}

function NodeName({
  nodeLoadable,
}: {
  nodeLoadable: LoadableWithAttr<ValueNode, { id: number }>;
}): JSX.Element {
  const node = nodeLoadable.getOrThrow();
  return <span>{node.name}</span>;
}

function TreeNode({
  nodeLoadable,
}: {
  nodeLoadable: LoadableWithAttr<ValueNode, { id: number }>;
}): JSX.Element {
  const node = nodeLoadable.getOrThrow();
  return (
    <div>
      <NodeName nodeLoadable={nodeLoadable} />
      {node.children !== null ? (
        <TreeArray nodeLoadables={node.children} />
      ) : null}
    </div>
  );
}

function TreeArray({
  nodeLoadables,
}: {
  nodeLoadables: Loadable<LoadableWithAttr<ValueNode, { id: number }>[]>;
}): JSX.Element {
  const nodes = nodeLoadables.getOrThrow();
  return (
    <ul>
      {nodes.map((n) => (
        <li key={n.attr.id}>
          <TreeNode nodeLoadable={n} />
        </li>
      ))}
    </ul>
  );
}

function TreeRoot({ nodeLoadable }: { nodeLoadable: Loadable<RootNode> }) {
  const node = nodeLoadable.getOrThrow();
  if (node.children === null) {
    throw new Error("panic");
  }
  return (
    <div>
      <h1>todree</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <TreeArray nodeLoadables={node.children} />
      </Suspense>
    </div>
  );
}

function App() {
  const items = useItems();

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
