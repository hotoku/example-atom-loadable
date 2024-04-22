import { atom } from "jotai";
import { RootNode } from "./model2";
import { Loadable } from "./loadable";

export const selectedIdAtom = atom<number | null>(null);

export const rootAtom = atom<Loadable<RootNode> | null>(null);
