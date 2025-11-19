import { describe, expect, it } from "vitest";
import simpleLib from "./index.js";

describe("index", () => {
  it("should return hello world", () => {
    expect(simpleLib()).toBe("hello world");
  });
});
