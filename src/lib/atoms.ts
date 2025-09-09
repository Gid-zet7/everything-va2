import { atom } from "jotai";

// Search-related atoms
export const isSearchingAtom = atom(false);
export const searchValueAtom = atom("");

// Thread-related atoms
export const threadIdAtom = atom<string | undefined>(undefined);

// Visual mode atoms
export const visualModeAtom = atom(false);
export const visualModeStartIdAtom = atom<string | null>(null);
