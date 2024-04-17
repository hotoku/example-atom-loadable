import { Item } from "./api";
import Loadable from "./loadable";

export class Node {
  children: Loadable<Loadable<ValueNode>[]> | null;
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
  static create(prm: Promise<Item[]>): Promise<RootNode> {
    return prm.then((items) => {
      const ret = new RootNode();
      const children = items.map(
        (item) =>
          new Loadable(Promise.resolve(new ValueNode(item.id, item.name, ret)))
      );
      ret.children = new Loadable(Promise.resolve(children));
      return ret;
    });
  }
}
