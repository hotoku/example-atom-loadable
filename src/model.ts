import { Item, loadChildren, loadRoot } from "./api";
import { Loadable, LoadableWithAttr } from "./loadable";

export class Node {
  open: boolean = false;
  children: Loadable<LoadableWithAttr<ValueNode, { id: number }>[]> | null;
  constructor() {
    this.children = null;
  }
}

export class ValueNode extends Node {
  id: number;
  name: string;
  parent: Node;
  constructor(id: number, name: string, parent: Node) {
    super();
    this.id = id;
    this.name = name;
    this.parent = parent;
  }

  async toggle(): Promise<void> {
    this.open = !this.open;
    if (this.open === true && this.children === null) {
      const loading = loadChildren(this.id).then((items) => {
        const children = items.map(
          (item) =>
            new LoadableWithAttr(
              Promise.resolve(new ValueNode(item.id, item.name, this)),
              { id: item.id }
            )
        );
        return children;
      });
      this.children = new Loadable(loading);
      await loading;
    } else {
      return Promise.resolve();
    }
  }
}

export class RootNode extends Node {
  static async create(prm: Promise<Item[]>): Promise<RootNode> {
    const items = await prm;
    const ret = new RootNode();
    const children = items.map(
      (item) =>
        new LoadableWithAttr(
          Promise.resolve(new ValueNode(item.id, item.name, ret)),
          {
            id: item.id,
          }
        )
    );
    ret.children = new Loadable(Promise.resolve(children));
    return ret;
  }
}

export function getRoot(): Promise<RootNode> {
  const loadingItems = loadRoot();
  return RootNode.create(loadingItems);
}
