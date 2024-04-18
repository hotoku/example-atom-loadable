import { Item } from "./api";
import { Loadable, LoadableWithAttr } from "./loadable";

export class Node {
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