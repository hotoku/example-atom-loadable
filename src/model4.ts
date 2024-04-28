import {
  loadRoot,
  loadChildren as loadChildrenApi,
  saveContent as saveContentApi,
  addItem,
  deleteItem,
} from "./api";
import { LP, LV, Loadable } from "./loadable";

type Content = Loadable<string>;
export type Children =
  | {
      type: "beforeLoad";
    }
  | {
      type: "loadStarted";
      loadable: Loadable<Loadable<ValueNode>[]>;
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

function item2node(item: {
  id: number;
  content: string;
  parent: Node;
}): ValueNode {
  return {
    type: "value",
    id: item.id,
    content: LV(item.content),
    parent: item.parent,
    children: { type: "beforeLoad" },
  };
}

export async function getRoot(): Promise<RootNode> {
  const items = await loadRoot();
  const ret: RootNode = {
    type: "root",
    id: null,
    children: { type: "beforeLoad" },
  };
  const children: Loadable<ValueNode>[] = [];
  for (const item of items) {
    const valueNode: ValueNode = item2node({
      id: item.id,
      content: item.content,
      parent: ret,
    });
    children.push(LV(valueNode));
  }
  ret.children = { type: "loadStarted", loadable: LV(children) };
  return ret;
}

export function loadChildren(node: ValueNode) {
  const loadingChildren = loadChildrenApi(node.id).then((items) => {
    const children = items.map((item) =>
      LV(item2node({ ...item, parent: node }))
    );
    return children;
  });
  node.children = { type: "loadStarted", loadable: LP(loadingChildren) };
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
    case "loadStarted":
      {
        const llNodes = children.loadable;
        if (llNodes.state.status === "fulfilled") {
          let lNodes = llNodes.state.data;
          if (backward) {
            lNodes = lNodes.slice().reverse();
          }
          for (const node of lNodes) {
            if (node.state.status === "fulfilled") {
              ret.push(...dfs(node.getOrThrow(), backward));
            }
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

export function addNode(
  root: RootNode,
  selected: number | null,
  openMap: Record<number, boolean>
): Promise<number | null> {
  let parent: Node;
  if (selected === null) {
    parent = root;
  } else {
    const cur = find(root, selected);
    if (openMap[cur.id]) {
      parent = cur;
    } else {
      parent = cur.parent;
    }
  }
  switch (parent.children.type) {
    case "beforeLoad":
      {
        const adding = addItem(parent.id).then((item) =>
          item2node({ ...item, parent })
        );
        const loadingChildren = loadChildrenApi(parent.id).then((items) =>
          items.map((item) => LV(item2node({ ...item, parent })))
        );
        const addingNode = Promise.all([adding, loadingChildren]).then(
          ([item, children]) => {
            children.push(LV(item));
            return children;
          }
        );
        parent.children = { type: "loadStarted", loadable: LP(addingNode) };
        return adding.then((item) => item.id);
      }
      break;
    case "loadStarted":
      console.log("addNode: loadStarted");
      if (parent.children.loadable.state.status === "fulfilled") {
        const children = parent.children.loadable.state.data;
        const adding = addItem(parent.id).then((item) =>
          item2node({ ...item, parent })
        );
        parent.children = {
          type: "loadStarted",
          loadable: LV([...children, LP(adding)]),
        };
        return adding.then((item) => item.id);
      } else {
        return Promise.resolve(selected);
      }
      break;
  }
}

export function removeNode(
  root: RootNode,
  selected: number | null,
  openMap: Record<number, boolean>
): Promise<number | null> {
  if (selected === null) {
    return Promise.resolve(selected);
  }
  const cur = find(root, selected);
  const parent = cur.parent;
  switch (parent.children.type) {
    case "beforeLoad":
      return Promise.resolve(selected);
    case "loadStarted": {
      const status = parent.children.loadable.state.status;
      if (status === "fulfilled") {
        const children = parent.children.loadable.state.data;
        const idxes = children.map((node) =>
          node.state.status === "fulfilled" ? node.state.data.id : -1
        );
        const idx = idxes.indexOf(selected);
        if (idx === -1) {
          return Promise.resolve(selected);
        }
        const ret = nextId(root, selected, openMap);
        const deleting = deleteItem(selected);
        console.log("try deleting");
        const updating = deleting
          .then(() => {
            return children.filter((_, i) => i !== idx);
          })
          .catch((e) => {
            console.error("removeNode error", e);
            return children;
          });
        parent.children = {
          type: "loadStarted",
          loadable: LP(updating),
        };
        return deleting.then(() => ret).catch(() => selected);
      } else {
        return Promise.resolve(selected);
      }
    }
  }
}

export function openAllNodes(root: RootNode): Record<number, boolean> {
  const ret: Record<number, boolean> = {};
  dfs(root).forEach((node) => {
    ret[node.id] = true;
  });
  return ret;
}
