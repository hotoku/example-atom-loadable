import { Suspense, useEffect } from "react";
import { ValueNode, getRoot, toggle } from "./model3";
import { rootAtom } from "./atoms";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { L, Loadable, LoadableWithAttr } from "./loadable";
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

function TreeNode({
  lNode,
}: {
  lNode: LoadableWithAttr<ValueNode, { id: number }>;
}): JSX.Element {
  const node = lNode.getOrThrow();
  const children = node.children;
  const buttonChar = node.open ? "-" : "+";
  const setRoot = useSetAtom(rootAtom);
  const handleOpenClick = () => {
    setRoot((root) => {
      if (root === null) {
        return root;
      }
      if (root.state.status !== "fulfilled") {
        return root;
      }
      const rootValue = root.getOrThrow();
      return L(toggle(rootValue, node));
    });
  };
  return (
    <span>
      <button onClick={handleOpenClick} style={{ marginRight: "5px" }}>
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
  array: Loadable<LoadableWithAttr<ValueNode, { id: number }>[]>;
  isTop?: boolean;
}): JSX.Element {
  const nodes = array.getOrThrow();
  return (
    <ul style={{ listStyle: "none", paddingInlineStart: isTop ? 0 : "40px" }}>
      {nodes.map((node) => {
        return (
          <li key={node.attr.id}>
            <Suspense fallback={<div>loading node</div>}>
              <TreeNode lNode={node} />
            </Suspense>
          </li>
        );
      })}
    </ul>
  );
}

function Root(): JSX.Element {
  const root = useAtomValue(rootAtom);
  if (root === null) {
    throw new Error("panic");
  }
  console.log("Root: root", root.state);
  const children = root.getOrThrow().children;
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
