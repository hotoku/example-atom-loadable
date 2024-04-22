import { loadChildren, loadRoot } from "./api";
import { Loadable, LoadableWithAttr } from "./loadable";

export type ValueNode = {
  type: "value";
  id: number;
  content: Loadable<string>;
  parent: Node;
  open: boolean;
} & {
  children: Loadable<LoadableWithAttr<ValueNode, { id: number }>[]> | null;
};

export type RootNode = {
  type: "root";
} & {
  children: LoadableWithAttr<ValueNode, { id: number }>[];
};

type Node = ValueNode | RootNode;

function flatten2(root: LoadableWithAttr<ValueNode, { id: number }>): number[] {
  const ret: number[] = [];
  const stack: LoadableWithAttr<ValueNode, { id: number }>[] = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (node === undefined) {
      break;
    }
    ret.push(node.attr.id);
    if (node.state.status !== "fulfilled") {
      continue;
    }
    const lChildren = node.getOrThrow().children;
    if (lChildren === null) {
      continue;
    }
    if (lChildren.state.status !== "fulfilled") {
      continue;
    }
    const children = lChildren.getOrThrow();
    const reversed = children.slice().reverse();
    stack.push(...reversed);
  }
  return ret;
}

export function flatten(root: RootNode): number[] {
  const ars = root.children.map((n) => flatten2(n));
  return ars.flat();
}

export async function getRoot(): Promise<RootNode> {
  const items = await loadRoot();
  const ret: RootNode = {
    type: "root",
    children: [],
  };
  for (const item of items) {
    const valueNode: ValueNode = {
      type: "value",
      id: item.id,
      content: new Loadable(Promise.resolve(item.content)),
      parent: ret,
      open: false,
      children: null,
    };
    const lwa = new LoadableWithAttr(Promise.resolve(valueNode), {
      id: item.id,
    });
    ret.children.push(lwa);
  }
  return ret;
}

export function previous(root: RootNode, id: number | null): number | null {
  const flat = flatten(root);
  if (id === null) {
    return flat[flat.length - 1];
  }
  const idx = flat.indexOf(id);
  if (idx === -1) {
    throw new Error("id not found");
  }
  if (idx === 0) {
    return flat[0];
  }
  return flat[idx - 1];
}

export function next(root: RootNode, id: number | null): number | null {
  const flat = flatten(root);
  console.log("next", flat);
  if (id === null) {
    return flat[0];
  }
  const idx = flat.indexOf(id);
  if (idx === -1) {
    throw new Error("id not found");
  }
  if (idx === flat.length - 1) {
    return flat[flat.length - 1];
  }
  return flat[idx + 1];
}

export function find(
  root: RootNode,
  id: number
): LoadableWithAttr<ValueNode, { id: number }> {
  for (const node of root.children) {
    const found = find2(node, id);
    if (found !== null) {
      return found;
    }
  }
  throw new Error("id not found");
}

export function find2(
  node: LoadableWithAttr<ValueNode, { id: number }>,
  id: number
): LoadableWithAttr<ValueNode, { id: number }> | null {
  if (node.attr.id === id) {
    return node;
  }
  if (node.state.status !== "fulfilled") {
    return null;
  }
  const children = node.getOrThrow().children;
  if (children === null) {
    return null;
  }
  if (children.state.status !== "fulfilled") {
    return null;
  }
  for (const child of children.getOrThrow()) {
    const found = find2(child, id);
    if (found !== null) {
      return found;
    }
  }
  return null;
}

export function toggle(root: RootNode, id: number): void {
  const node = find(root, id);
  const valueNode = node.getOrThrow();
  valueNode.open = !valueNode.open;
  if (valueNode.open) {
    if (valueNode.children === null) {
      const loading = loadChildren(valueNode.id).then((items) => {
        const children = items.map((item) => {
          const valueNode: ValueNode = {
            type: "value",
            id: item.id,
            content: new Loadable(Promise.resolve(item.content)),
            parent: node.getOrThrow(),
            open: false,
            children: null,
          };
          const lwa = new LoadableWithAttr(Promise.resolve(valueNode), {
            id: item.id,
          });
          return lwa;
        });
        return children;
      });
      valueNode.children = new Loadable(loading);
    }
  }
}
