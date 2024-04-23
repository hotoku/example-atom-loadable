import { atom } from "jotai";
import { RootNode } from "./model3";
import { Loadable } from "./loadable";

export const selectedIdAtom = atom<number | null>(null);

export const rootAtom = atom<Loadable<RootNode> | null>(null);
