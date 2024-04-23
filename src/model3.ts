import {
  addItem,
  loadChildren,
  loadRoot,
  saveContent as saveContentApi,
} from "./api";
import { LP, LV, Loadable } from "./loadable";

type Content = Loadable<string>;
type Children = Loadable<ValueNode[]> | null;

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
  id: null;
  children: Children;
};

type Node = ValueNode | RootNode;

export async function getRoot(): Promise<RootNode> {
  const items = await loadRoot();
  const ret: RootNode = {
    type: "root",
    id: null,
    children: LV([]),
  };
  const children = [];
  for (const item of items) {
    const valueNode: ValueNode = {
      type: "value",
      id: item.id,
      content: LV(item.content),
      parent: ret,
      open: false,
      children: null,
    };
    children.push(valueNode);
  }
  ret.children = LV(children);
  return ret;
}

function findNode(root: RootNode, id: number): ValueNode | null {
  const nodes = dfs(root);
  return nodes.find((node) => node.id === id) || null;
}

export function toggle(root: RootNode, selected: number): RootNode {
  const node = findNode(root, selected);
  if (node === null) {
    throw new Error("panic: node not found");
  }
  node.open = !node.open;
  const parent = node.parent;
  const siblings = parent.children;
  if (siblings === null) {
    throw new Error("panic: children is null");
  }
  if (siblings.state.status !== "fulfilled") {
    throw new Error("panic: children is not fulfilled");
  }
  if (node.open && node.children === null) {
    const loading: Promise<ValueNode[]> = loadChildren(node.id).then((items) =>
      items.map((item) => ({
        type: "value",
        id: item.id,
        content: LV(item.content),
        parent: node,
        open: false,
        children: null,
      }))
    );
    node.children = LP(loading);
  }
  return root;
}

function dfs(cur: Node, backward: boolean = false): ValueNode[] {
  const ret: ValueNode[] = [];
  if (cur.type === "value") {
    ret.push(cur);
  }
  if (cur.children === null) {
    return ret;
  }
  if (cur.children.state.status !== "fulfilled") {
    return ret;
  }
  const children = backward
    ? cur.children.getOrThrow().slice().reverse()
    : cur.children.getOrThrow();
  for (const child of children) {
    ret.push(...dfs(child, backward));
  }
  return ret;
}

function open(node: Node): boolean {
  if (node.type === "root") {
    return true;
  }
  return node.open && open(node.parent);
}

export function nextId(root: RootNode, curId: number | null): number | null {
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
    if (open(nodes[i].parent)) {
      return nodes[i].id;
    }
  }
  return curId;
}

export function previousId(
  root: RootNode,
  curId: number | null
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
    if (open(nodes[i].parent)) {
      return nodes[i].id;
    }
  }
  return curId;
}

export function saveContent(
  root: RootNode,
  node: ValueNode,
  content: string
): RootNode {
  node.content = LP(saveContentApi(node.id, content));
  return root;
}

export function addNode(
  root: RootNode,
  curId: number | null,
  cb: (newId: number) => void
): RootNode {
  let parent: Node;
  if (curId === null) {
    parent = root;
  } else {
    const node = findNode(root, curId);
    if (node === null) {
      throw new Error("panic: node not found");
    }
    parent = node;
  }
  if (parent.type === "value") {
    parent.open = true;
  }
  const children = parent.children;
  let addingChildren: Promise<ValueNode[]>;
  if (children === null) {
    const loadingChildren: Promise<ValueNode[]> = loadChildren(parent.id).then(
      (items) =>
        items.map((item) => ({
          type: "value",
          id: item.id,
          content: LV(item.content),
          parent: parent,
          open: false,
          children: null,
        }))
    );
    addingChildren = loadingChildren.then((items) => {
      const newItem = addItem(parent.id).then((item) => {
        const ret: ValueNode[] = [
          ...items,
          {
            type: "value",
            id: item.id,
            content: LV(item.content),
            parent: parent,
            open: false,
            children: null,
          },
        ];
        return ret;
      });
      return newItem;
    });
  } else {
    if (children.state.status !== "fulfilled") {
      return root;
    }
    addingChildren = addItem(parent.id).then((item) => {
      const newChild: ValueNode = {
        type: "value",
        id: item.id,
        content: LV(item.content),
        parent: parent,
        open: false,
        children: null,
      };
      return [...children.getOrThrow(), newChild];
    });
  }
  addingChildren = addingChildren.then((items) => {
    cb(items[items.length - 1].id);
    return items;
  });
  parent.children = LP(addingChildren);
  return root;
}
