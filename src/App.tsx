import { Suspense, useEffect, useRef, useState } from "react";
import {
  Children,
  ValueNode,
  find,
  getRoot,
  loadChildren,
  nextId,
  previousId,
  saveContent,
} from "./model4";
import { editingAtom, openMapAtom, rootAtom, selectedIdAtom } from "./atoms";
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
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("change", e.target.value);
    e.preventDefault();
    setVal(e.target.value);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log("key", e.key);
    if (!e.nativeEvent.isComposing && e.key === "Enter") {
      saveContent(node, val);
    }
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
  const editing = useAtomValue(editingAtom);
  const [selected, setSelected] = useAtom(selectedIdAtom);
  const alpha = selected === node.id ? 1 : 0.2;
  const [openMap, setOpenMap] = useAtom(openMapAtom);
  const open = openMap[node.id] || false;
  const buttonChar = open ? "-" : "+";

  const handleOpenClick = () => {
    if (node.children.type === "beforeLoad") {
      loadChildren(node);
    }
    setSelected(node.id);
    setOpenMap((prev) => {
      return { ...prev, [node.id]: !open };
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
      <span> {open ? "open" : "close"} / </span>
      <span> {node.id} / </span>
      <Suspense fallback={<span>loading content</span>}>
        {editing && selected === node.id ? (
          <ContentEditor node={node} />
        ) : (
          <NodeContent lContent={node.content} />
        )}
      </Suspense>
      <ul>{open ? <NodeArray children={children} /> : null}</ul>
    </span>
  );
}

function TreeNodeLoading({
  lNode,
}: {
  lNode: Loadable<ValueNode>;
}): JSX.Element {
  const node = lNode.getOrThrow();
  return <TreeNode node={node} />;
}

function TreeArrayAll({
  array,
  isTop,
}: {
  array: Loadable<ValueNode[]>;
  isTop?: boolean;
}): JSX.Element {
  const loadable = array.getOrThrow();
  return (
    <ul style={{ listStyle: "none", paddingInlineStart: isTop ? 0 : "40px" }}>
      {loadable.map((node) => {
        const key = node.id;
        return (
          <li key={key}>
            <TreeNode node={node} />
          </li>
        );
      })}
    </ul>
  );
}

function TreeArrayPart({
  array,
  isTop,
}: {
  array: Loadable<ValueNode>[];
  isTop?: boolean;
}): JSX.Element {
  return (
    <ul style={{ listStyle: "none", paddingInlineStart: isTop ? 0 : "40px" }}>
      {array.map((node, idx) => {
        const key =
          node.state.status === "fulfilled" ? node.state.data.id : "KEY-" + idx;
        return (
          <li key={key}>
            <Suspense fallback={<div>loading node</div>}>
              <TreeNodeLoading lNode={node} />
            </Suspense>
          </li>
        );
      })}
    </ul>
  );
}

function NodeArray({ children }: { children: Children }): JSX.Element {
  switch (children.type) {
    case "beforeLoad":
      return <div>before loading children</div>;
    case "loadingAll":
      return (
        <Suspense fallback={<div>loading whole children</div>}>
          <TreeArrayAll array={children.loadable} isTop={true} />
        </Suspense>
      );
    case "loadingSome":
      return <TreeArrayPart array={children.loadable} isTop={true} />;
  }
}

function Root(): JSX.Element {
  const [lRoot, setRoot] = useAtom(rootAtom);
  if (lRoot === null) {
    throw new Error("panic: root is null");
  }
  const root = lRoot.getOrThrow();
  const children = root.children;
  const [selected, setSelected] = useAtom(selectedIdAtom);
  const [editing, setEditing] = useAtom(editingAtom);
  const [openMap, setOpenMap] = useAtom(openMapAtom);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (editing && !(e.key === "Enter" || e.key === "Escape")) return;
      switch (e.key) {
        case "a":
          if (root === null) {
            return root;
          } else {
            const rootValue = root.getOrThrow();
            const cb = (newId: number) => {
              setRoot(() => {
                return LV(rootValue);
              });
              setSelected(newId);
            };
            addNode(rootValue, selected, cb);
            return LV(rootValue);
          }
          break;
        case "j":
          setSelected((prev) => {
            const next = nextId(root, prev, openMap);
            console.log("next", next);
            return next;
          });
          break;
        case "k":
          setSelected((prev) => {
            const next = previousId(root, prev, openMap);
            return next;
          });
          break;
        case "Tab":
          if (selected === null) {
            break;
          }
          if (!openMap[selected]) {
            const node = find(root, selected);
            if (node.children.type === "beforeLoad") {
              loadChildren(node);
            }
          }
          setOpenMap((prev) => {
            return { ...prev, [selected]: !prev[selected] };
          });
          break;
        case "Enter":
          if (e.keyCode === 229) {
            break;
          }
          if (selected === null) {
            break;
          }
          if (editing) {
            setEditing(false);
            break;
          }
          setEditing(true);
          break;
        case "Escape":
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
  }, [
    editing,
    openMap,
    root,
    selected,
    setEditing,
    setOpenMap,
    setRoot,
    setSelected,
  ]);

  return <NodeArray children={children} />;
}

export function App(): JSX.Element {
  const [root, setRoot] = useAtom(rootAtom);
  const setSelected = useSetAtom(selectedIdAtom);
  const setOpenMap = useSetAtom(openMapAtom);
  useEffect(() => {
    setSelected(null);
    setOpenMap({});
    sleep(1).then(() => {
      const root = getRoot();
      const lRoot = LP(root);
      setRoot(lRoot);
    });
  }, [setOpenMap, setRoot, setSelected]);

  const [val, setVal] = useState("");
  return (
    <>
      <input type="text" value={val} onChange={(e) => setVal(e.target.value)} />

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
