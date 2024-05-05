import { POB_TARGET } from "pob-babel";

export default function simpleLib(): string {
  return `hello world via ${POB_TARGET === "node" ? "node" : "browser"}`;
}
