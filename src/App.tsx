import { Suspense, useEffect } from "react";
import { ValueNode, getRoot, nextId, previousId, toggle } from "./model3";
import { rootAtom, selectedIdAtom } from "./atoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { L, Loadable } from "./loadable";
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

function TreeNode({ node }: { node: ValueNode }): JSX.Element {
  const children = node.children;
  const buttonChar = node.open ? "-" : "+";
  const setRoot = useSetAtom(rootAtom);
  const handleOpenClick = () => {
    setRoot((root) => {
      if (root === null) {
        return root;
      }
      const rootValue = root.getOrThrow();
      return L(toggle(rootValue, node.id));
    });
  };
  const selected = useAtomValue(selectedIdAtom);
  const alpha = selected === node.id ? 1 : 0.2;
  return (
    <span>
      <button
        onClick={handleOpenClick}
        style={{ marginRight: "5px", backgroundColor: `rgba(0,0,0,${alpha})` }}
      >
        {buttonChar}
      </button>
      <Suspense fallback={<div>loading content</div>}>
        <NodeContent lContent={node.content} />
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
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
          if (selected === null) {
            return;
          }
          setRoot((root) => {
            if (root === null) {
              return root;
            }
            const rootValue = root.getOrThrow();
            return L(toggle(rootValue, selected));
          });
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
  }, [root, selected, setRoot, setSelected]);

  return (
    <Suspense fallback={<div>loading children</div>}>
      {children ? <TreeArray array={children} isTop={true} /> : null}
    </Suspense>
  );
}

export function App(): JSX.Element {
  const [root, setRoot] = useAtom(rootAtom);
  useEffect(() => {
    sleep(1).then(() => setRoot(new Loadable(getRoot())));
  }, [setRoot]);

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
