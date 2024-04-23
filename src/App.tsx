import { Suspense, useEffect, useRef, useState } from "react";
import {
  ValueNode,
  getRoot,
  nextId,
  previousId,
  saveContent,
  toggle,
} from "./model3";
import { editingAtom, rootAtom, selectedIdAtom } from "./atoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Loadable, LV, LP } from "./loadable";
import { sleep } from "./api";

import "./App.css";

function NodeContent({
  lContent,
}: {
  lContent: Loadable<string>;
}): JSX.Element {
  const content = lContent.getOrThrow();
  return <span>{content}</span>;
}

function ContentEditor({ node }: { node: ValueNode }): JSX.Element {
  const [val, setVal] = useState(node.content.getOrThrow());
  const setRoot = useSetAtom(rootAtom);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setVal(e.target.value);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.key !== "Enter") return;
    setRoot((root) => {
      if (root === null) {
        throw new Error("panic: root is null");
      }
      const newRoot = saveContent(root.getOrThrow(), node, val);
      return LV(newRoot);
    });
  };

  return (
    <input
      type="text"
      value={val}
      ref={ref}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
}

function TreeNode({ node }: { node: ValueNode }): JSX.Element {
  const children = node.children;
  const buttonChar = node.open ? "-" : "+";
  const editing = useAtomValue(editingAtom);
  const [selected, setSelected] = useAtom(selectedIdAtom);
  const alpha = selected === node.id ? 1 : 0.2;
  const setRoot = useSetAtom(rootAtom);
  const handleOpenClick = () => {
    setRoot((root) => {
      if (root === null) throw new Error("panic: root is null");
      const rootValue = root.getOrThrow();
      setSelected(node.id);
      return LV(toggle(rootValue, node.id));
    });
  };
  return (
    <span>
      <button
        onClick={handleOpenClick}
        style={{ marginRight: "5px", backgroundColor: `rgba(0,0,0,${alpha})` }}
      >
        {buttonChar}
      </button>
      <Suspense fallback={<span>loading content</span>}>
        {editing && selected === node.id ? (
          <ContentEditor node={node} />
        ) : (
          <NodeContent lContent={node.content} />
        )}
      </Suspense>
      {children && node.open ? (
        <Suspense fallback={<div>loading children</div>}>
          <TreeArray array={children} />
        </Suspense>
      ) : null}
    </span>
  );
}

function TreeArray({
  array,
  isTop,
}: {
  array: Loadable<ValueNode[]>;
  isTop?: boolean;
}): JSX.Element {
  const nodes = array.getOrThrow();
  return (
    <ul style={{ listStyle: "none", paddingInlineStart: isTop ? 0 : "40px" }}>
      {nodes.map((node) => {
        return (
          <li key={node.id}>
            <Suspense fallback={<div>loading node</div>}>
              <TreeNode node={node} />
            </Suspense>
          </li>
        );
      })}
    </ul>
  );
}

function Root(): JSX.Element {
  const [root, setRoot] = useAtom(rootAtom);
  if (root === null) {
    throw new Error("panic: root is null");
  }
  const children = root.getOrThrow().children;
  const [selected, setSelected] = useAtom(selectedIdAtom);
  const [editing, setEditing] = useAtom(editingAtom);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "j":
          setSelected((prev) => {
            const next = nextId(root.getOrThrow(), prev);
            return next;
          });
          break;
        case "k":
          setSelected((prev) => {
            const next = previousId(root.getOrThrow(), prev);
            return next;
          });
          break;
        case "Tab":
          e.preventDefault();
          if (selected === null) {
            return;
          }
          setRoot((root) => {
            if (root === null) {
              return root;
            }
            const rootValue = root.getOrThrow();
            return LV(toggle(rootValue, selected));
          });
          break;
        case "Enter":
          if (e.keyCode === 229) {
            return;
          }
          if (selected === null) {
            return;
          }
          if (editing) {
            setEditing(false);
            return;
          }
          setEditing(true);
          break;
        case "Escape":
          if (!editing) {
            return;
          }
          setEditing(false);
          break;
        default:
          console.log("default", e.key);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [editing, root, selected, setEditing, setRoot, setSelected]);

  return (
    <Suspense fallback={<div>loading children</div>}>
      {children ? <TreeArray array={children} isTop={true} /> : null}
    </Suspense>
  );
}

export function App(): JSX.Element {
  const [root, setRoot] = useAtom(rootAtom);
  const setSelected = useSetAtom(selectedIdAtom);
  useEffect(() => {
    setSelected(null);
    sleep(1).then(() => setRoot(LP(getRoot())));
  }, [setRoot, setSelected]);

  return (
    <>
      <h1>todree</h1>
      {root ? (
        <Suspense fallback={<div>loading root</div>}>
          <Root />
        </Suspense>
      ) : (
        <div>before loading</div>
      )}
    </>
  );
}

export default App;
