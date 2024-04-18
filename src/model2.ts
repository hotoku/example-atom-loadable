import { Loadable, LoadableWithAttr } from "./loadable";

type ValueNode = {
  type: "value";
  id: number;
  content: Loadable<string>;
  parent: Node;
} & {
  children: Loadable<LoadableWithAttr<ValueNode, { id: number }>[]> | null;
};

type RootNode = {
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
    stack.push(...children.reverse());
  }
  return ret;
}

export function flatten(root: RootNode): number[] {
  const ars = root.children.map((n) => flatten2(n));
  return ars.flat();
}
