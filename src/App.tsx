import { ChangeEvent, Suspense, useEffect, useRef, useState } from "react";
import "./App.css";
import { Loadable, LoadableWithAttr } from "./loadable";
import { RootNode, ValueNode, getRoot } from "./model";
import { useUpdate } from "./hooks";
import { useAtomValue } from "jotai";
import { selectedIdAtom } from "./atoms";

function useItems() {
  const [items, setItems] = useState<Loadable<RootNode> | null>(null);

  useEffect(() => {
    new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
      setItems(new Loadable(getRoot()));
    });
  }, []);

  return items;
}

function LineEditor({
  initialValue,
  onFinish,
}: {
  initialValue: string;
  onFinish: (s: string) => void;
}): JSX.Element {
  const [value, setValue] = useState(initialValue);
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
    onFinish(value);
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
  const selectedId = useAtomValue(selectedIdAtom);
  const alpha = selectedId === node.id ? 1 : 0.2;

  const handleToggle = () => {
    node.toggle();
    updateParent();
  };

  const startEdit = () => {
    if (editing) return;
    setEditing(true);
  };

  const onEditEnd = (v: string) => {
    node.updateName(v);
    setEditing(false);
  };

  return (
    <span>
      <button
        onClick={handleToggle}
        style={{ marginRight: "3px", backgroundColor: `rgba(1,1,1,${alpha})` }}
      >
        {node.open ? "-" : "+"}
      </button>
      {editing ? (
        <LineEditor
          initialValue={node.name.getOrThrow()}
          onFinish={onEditEnd}
        />
      ) : (
        <span
          style={{
            display: "inline-block",
            width: "30rem",
            backgroundColor:
              import.meta.env.MODE === "development" ? "#f0f0f0" : "",
            paddingLeft: "5px",
          }}
          onClick={startEdit}
        >
          {node.name.getOrThrow()}
        </span>
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
      <Suspense fallback={<div>Loading...</div>}>
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
      <h1>todree</h1>
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
