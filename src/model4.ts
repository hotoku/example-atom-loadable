import {
  loadRoot,
  loadChildren as loadChildrenApi,
  saveContent as saveContentApi,
  addItem,
} from "./api";
import { LP, LV, Loadable } from "./loadable";

type Content = Loadable<string>;
export type Children =
  | {
      type: "beforeLoad";
    }
  | {
      type: "loadingAll";
      loadable: Loadable<ValueNode[]>;
    }
  | {
      type: "loadingSome";
      loadable: Loadable<ValueNode>[];
    };

export type ValueNode = {
  type: "value";
  id: number;
  content: Content;
  children: Children;
  parent: Node;
};

export type RootNode = {
  type: "root";
  id: null;
  children: Children;
};

type Node = ValueNode | RootNode;

export async function getRoot(): Promise<RootNode> {
  const items = await loadRoot();
  const ret: RootNode = {
    type: "root",
    id: null,
    children: { type: "beforeLoad" },
  };
  const children: Loadable<ValueNode>[] = [];
  for (const item of items) {
    const valueNode: ValueNode = {
      type: "value",
      id: item.id,
      content: LV(item.content),
      parent: ret,
      children: { type: "beforeLoad" },
    };
    children.push(LV(valueNode));
  }
  ret.children = { type: "loadingSome", loadable: children };
  return ret;
}

export function loadChildren(node: ValueNode) {
  const loadingChildren = loadChildrenApi(node.id).then((items) => {
    const children: ValueNode[] = items.map((item) => {
      return {
        type: "value",
        id: item.id,
        content: LV(item.content),
        parent: node,
        children: { type: "beforeLoad" },
      };
    });
    return children;
  });
  node.children = { type: "loadingAll", loadable: LP(loadingChildren) };
}

function dfs(cur: Node, backward: boolean = false): ValueNode[] {
  const ret: ValueNode[] = [];
  if (cur.type === "value") {
    ret.push(cur);
  }
  const children = cur.children;
  switch (children.type) {
    case "beforeLoad":
      break;
    case "loadingAll":
      {
        const lNodes = children.loadable;
        if (lNodes.state.status === "fulfilled") {
          let nodes = lNodes.state.data;
          if (backward) {
            nodes = nodes.slice().reverse();
          }
          for (const node of nodes) {
            ret.push(...dfs(node, backward));
          }
        }
      }
      break;
    case "loadingSome":
      {
        let lNodes = children.loadable;
        if (backward) {
          lNodes = lNodes.slice().reverse();
        }
        for (const lNode of lNodes) {
          switch (lNode.state.status) {
            case "pending":
              break;
            case "fulfilled":
              ret.push(...dfs(lNode.state.data, backward));
              break;
            case "rejected":
              break;
          }
        }
      }
      break;
  }
  return ret;
}

function open(node: Node, openMap: Record<number, boolean>): boolean {
  if (node.type === "root") {
    return true;
  }
  const ret: boolean | undefined = openMap[node.id];
  return ret === undefined ? false : ret;
}

export function nextId(
  root: RootNode,
  curId: number | null,
  openMap: Record<number, boolean>
): number | null {
  const nodes = dfs(root);
  if (nodes.length === 0) {
    return null;
  }
  if (curId === null) {
    return nodes[0].id;
  }
  const curIdx = nodes.findIndex((node) => node.id === curId);
  if (curIdx === -1) {
    throw new Error("panic: node not found");
  }
  for (let i = curIdx + 1; i < nodes.length; i++) {
    if (open(nodes[i].parent, openMap)) {
      return nodes[i].id;
    }
  }
  return curId;
}

export function previousId(
  root: RootNode,
  curId: number | null,
  openMap: Record<number, boolean>
): number | null {
  const nodes = dfs(root);
  if (nodes.length === 0) {
    return null;
  }
  if (curId === null) {
    return nodes[nodes.length - 1].id;
  }
  const curIdx = nodes.findIndex((node) => node.id === curId);
  if (curIdx === -1) {
    throw new Error("panic: node not found");
  }
  for (let i = curIdx - 1; i >= 0; i--) {
    if (open(nodes[i].parent, openMap)) {
      return nodes[i].id;
    }
  }
  return curId;
}

export function find(root: RootNode, id: number): ValueNode {
  const nodes = dfs(root);
  const ret = nodes.find((node) => node.id === id);
  if (ret === undefined) {
    throw new Error("panic: node not found");
  }
  return ret;
}

export function saveContent(node: ValueNode, content: string) {
  const saving = saveContentApi(node.id, content);
  node.content = LP(saving);
}

export function addNode(root: RootNode, selected: number | null) {
  const parent = selected === null ? root : find(root, selected).parent;
  const adding = addItem(selected).then((item) => {
    const valueNode: ValueNode = {
      type: "value",
      id: item.id,
      content: LV(item.content),
      parent: root,
      children: { type: "beforeLoad" },
    };
    return valueNode;
  });
  root.children = { type: "loadingAll", loadable: LP(adding) };
}
