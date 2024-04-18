import { ChangeEvent, Suspense, useEffect, useRef, useState } from "react";
import "./App.css";
import { Loadable, LoadableWithAttr } from "./loadable";
import { RootNode, ValueNode, getRoot } from "./model";
import { useUpdate } from "./hooks";

function useItems() {
  const [items, setItems] = useState<Loadable<RootNode> | null>(null);

  useEffect(() => {
    new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
      setItems(new Loadable(getRoot()));
    });
  }, []);

  return items;
}

function NodeEditor({
  node,
  onFinish,
}: {
  node: ValueNode;
  onFinish: () => void;
}): JSX.Element {
  const [value, setValue] = useState(node.name);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.key !== "Enter") return;
    onFinish();
  };
  return (
    <input
      value={value}
      ref={ref}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
}

function NodeLine({
  nodeLoadable,
  updateParent,
}: {
  nodeLoadable: LoadableWithAttr<ValueNode, { id: number }>;
  updateParent: () => void;
}): JSX.Element {
  const node = nodeLoadable.getOrThrow();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");

  const handleToggle = () => {
    node.toggle();
    updateParent();
  };

  const startEdit = () => {
    if (editing) return;
    setEditing(true);
  };

  return (
    <span>
      <button onClick={handleToggle} style={{ marginRight: "3px" }}>
        {node.open ? "-" : "+"}
      </button>
      {editing ? (
        <NodeEditor node={node} onFinish={() => setEditing(false)} />
      ) : (
        <span onClick={startEdit}>{node.name}</span>
      )}
    </span>
  );
}

function TreeNode({
  nodeLoadable,
}: {
  nodeLoadable: LoadableWithAttr<ValueNode, { id: number }>;
}): JSX.Element {
  const node = nodeLoadable.getOrThrow();
  const { update } = useUpdate();
  return (
    <div>
      <Suspense>
        <NodeLine nodeLoadable={nodeLoadable} updateParent={update} />
      </Suspense>
      {node.children !== null && node.open ? (
        <Suspense fallback={<div>Loading...</div>}>
          <TreeArray nodeLoadables={node.children} />
        </Suspense>
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
          <Suspense fallback={<div>Loading...</div>}>
            <TreeNode nodeLoadable={n} />
          </Suspense>
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
