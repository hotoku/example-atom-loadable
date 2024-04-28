import { atom } from "jotai";
import { RootNode } from "./model";
import { Loadable } from "./loadable";

export const selectedIdAtom = atom<number | null>(null);
export const rootAtom = atom<Loadable<RootNode> | null>(null);
export const editingAtom = atom<boolean>(false);
export const openMapAtom = atom<Record<number, boolean>>({});
