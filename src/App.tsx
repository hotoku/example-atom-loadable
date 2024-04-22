import { ChangeEvent, Suspense, useEffect, useRef, useState } from "react";
import "./App.css";
import { Loadable, LoadableWithAttr } from "./loadable";
import { RootNode, ValueNode, getRoot, next, previous, toggle } from "./model2";
import { useUpdate } from "./hooks";
import { useAtom, useAtomValue } from "jotai";
import { rootAtom, selectedIdAtom } from "./atoms";

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
  node,
  updateParent,
}: {
  node: ValueNode;
  updateParent: () => void;
}): JSX.Element {
  const [editing, setEditing] = useState(false);
  const selectedId = useAtomValue(selectedIdAtom);
  const alpha = selectedId === node.id ? 1 : 0.2;
  const root = useAtomValue(rootAtom)?.getOrThrow();

  const handleToggle = () => {
    if (root) {
      console.log("toggle", node.id);
      toggle(root, node.id);
      updateParent();
    }
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
          initialValue={node.content.getOrThrow()}
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
          {node.content.getOrThrow()}
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
        <NodeLine node={node} updateParent={update} />
      </Suspense>
      {node.children !== null && node.open ? (
        <Suspense fallback={<div>Loading...</div>}>
          <TreeArray lNodes={node.children} />
        </Suspense>
      ) : null}
    </div>
  );
}

function TreeArray({
  lNodes,
}: {
  lNodes: Loadable<LoadableWithAttr<ValueNode, { id: number }>[]>;
}): JSX.Element {
  console.log(lNodes.state);
  const nodes = lNodes.getOrThrow();

  return (
    <ul>
      {nodes.map((n) => (
        <li key={n.attr.id}>
          <Suspense fallback={<div>TreeNode Loading...</div>}>
            <TreeNode nodeLoadable={n} />
          </Suspense>
        </li>
      ))}
    </ul>
  );
}

function TreeRoot({ nodeLoadable }: { nodeLoadable: Loadable<RootNode> }) {
  const node = nodeLoadable.getOrThrow();
  const children = new Loadable(Promise.resolve(node.children));
  const [selectedId, setSelectedId] = useAtom(selectedIdAtom);
  const { update } = useUpdate();

  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "k":
          setSelectedId((prev) => previous(node, prev));
          break;
        case "ArrowDown":
        case "j":
          setSelectedId((prev) => next(node, prev));
          break;
        case "Tab":
          e.preventDefault();
          if (selectedId) {
            console.log("Tab", selectedId);
            toggle(node, selectedId);
            update();
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", keydownHandler);
    return () => window.removeEventListener("keydown", keydownHandler);
  }, [node, selectedId, setSelectedId, update]);

  return (
    <div>
      <Suspense fallback={<div>TreeArray Loading...</div>}>
        <TreeArray lNodes={children} />
      </Suspense>
    </div>
  );
}

function App() {
  const [root, setRoot] = useAtom(rootAtom);
  useEffect(() => {
    new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
      const root = getRoot();
      setRoot(new Loadable(root));
    });
  }, [setRoot]);

  return (
    <>
      <h1>todree</h1>
      <Suspense fallback={<div>TreeRoot Loading...</div>}>
        {root ? <TreeRoot nodeLoadable={root} /> : <div>before loading...</div>}
      </Suspense>
    </>
  );
}

export default App;
