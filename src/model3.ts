import { loadChildren, loadRoot } from "./api";
import { L, LWA, Loadable, LoadableWithAttr } from "./loadable";

type Content = Loadable<string>;
type Children = Loadable<LoadableWithAttr<ValueNode, { id: number }>[]> | null;

export type ValueNode = {
  type: "value";
  id: number;
  content: Content;
  children: Children;
  open: boolean;
  parent: Node;
};

export type RootNode = {
  type: "root";
  children: Children;
};

type Node = ValueNode | RootNode;

export async function getRoot(): Promise<RootNode> {
  const items = await loadRoot();
  const ret: RootNode = {
    type: "root",
    children: L([]),
  };
  const children = [];
  for (const item of items) {
    const valueNode: ValueNode = {
      type: "value",
      id: item.id,
      content: L(item.content),
      parent: ret,
      open: false,
      children: null,
    };
    const lwa = LWA(valueNode, {
      id: item.id,
    });
    children.push(lwa);
  }
  ret.children = L(children);
  return ret;
}

export function toggle(root: RootNode, node: ValueNode): RootNode {
  const newNode = { ...node, open: !node.open };
  const parent = node.parent;
  const siblings = parent.children;
  if (siblings === null) {
    throw new Error("panic: children is null");
  }
  if (siblings.state.status !== "fulfilled") {
    throw new Error("panic: children is not fulfilled");
  }
  const index = siblings.getOrThrow().findIndex((n) => n.attr.id === node.id);
  siblings.getOrThrow()[index] = LWA(newNode, { id: node.id });
  if (newNode.open && newNode.children === null) {
    newNode.children = new Loadable(
      (async () => {
        const items = await loadChildren(node.id);
        const children = [];
        for (const item of items) {
          const valueNode: ValueNode = {
            type: "value",
            id: item.id,
            content: L(item.content),
            parent: newNode,
            open: false,
            children: null,
          };
          const lwa = LWA(valueNode, {
            id: item.id,
          });
          children.push(lwa);
        }
        return children;
      })()
    );
  }
  return { ...root };
}
