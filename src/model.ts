import { Item, loadChildren, loadRoot, updateName } from "./api";
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
  name: Loadable<string>;
  parent: Node;
  constructor(id: number, name: string, parent: Node) {
    super();
    this.id = id;
    this.name = new Loadable(Promise.resolve(name));
    this.parent = parent;
  }

  async toggle(): Promise<void> {
    this.open = !this.open;
    if (this.open === true && this.children === null) {
      const loading = loadChildren(this.id).then((items) => {
        const children = items.map(
          (item) =>
            new LoadableWithAttr(
              Promise.resolve(new ValueNode(item.id, item.content, this)),
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

  async updateName(v: string): Promise<void> {
    const updating = updateName(this.id, v);
    this.name = new Loadable(updating);
    await updating;
    return;
  }
}

export class RootNode extends Node {
  static async create(prm: Promise<Item[]>): Promise<RootNode> {
    const items = await prm;
    const ret = new RootNode();
    const children = items.map(
      (item) =>
        new LoadableWithAttr(
          Promise.resolve(new ValueNode(item.id, item.content, ret)),
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
