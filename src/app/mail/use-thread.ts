import { useAtom } from "jotai";
import { threadIdAtom } from "@/lib/atoms";

export function useThread() {
  return useAtom(threadIdAtom);
}
