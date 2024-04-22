import { loadRoot } from "./api";
import { Loadable, LoadableWithAttr } from "./loadable";

export type ValueNode = {
  type: "value";
  id: number;
  content: Loadable<string>;
  children: Loadable<LoadableWithAttr<ValueNode, { id: number }>[]> | null;
  open: boolean;
  parent: Node;
};

export type RootNode = {
  type: "root";
  children: LoadableWithAttr<ValueNode, { id: number }>[];
};

type Node = ValueNode | RootNode;

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
