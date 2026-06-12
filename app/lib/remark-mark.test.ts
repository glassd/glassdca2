import { describe, expect, it } from "vitest";
import type { Root } from "mdast";
import { remarkMark } from "./remark-mark";

function run(text: string) {
  const tree: Root = {
    type: "root",
    children: [{ type: "paragraph", children: [{ type: "text", value: text }] }],
  };
  const transform = (remarkMark as any)();
  transform(tree);
  return (tree.children[0] as any).children;
}

describe("remarkMark", () => {
  it("leaves plain text untouched", () => {
    const children = run("nothing special here");
    expect(children).toEqual([{ type: "text", value: "nothing special here" }]);
  });

  it("converts ==text== into a mark node", () => {
    const children = run("before ==acid== after");
    expect(children).toHaveLength(3);
    expect(children[0]).toEqual({ type: "text", value: "before " });
    expect(children[1].type).toBe("emphasis");
    expect(children[1].data).toEqual({ hName: "mark" });
    expect(children[1].children).toEqual([{ type: "text", value: "acid" }]);
    expect(children[2]).toEqual({ type: "text", value: " after" });
  });

  it("handles multiple marks in one text node", () => {
    const children = run("==a== and ==b==");
    const marks = children.filter((c: any) => c.data?.hName === "mark");
    expect(marks).toHaveLength(2);
    expect(marks[0].children[0].value).toBe("a");
    expect(marks[1].children[0].value).toBe("b");
  });

  it("does not match across newlines", () => {
    const children = run("==spans\nlines==");
    expect(children).toEqual([{ type: "text", value: "==spans\nlines==" }]);
  });

  it("ignores unbalanced markers", () => {
    const children = run("just ==one side");
    expect(children).toEqual([{ type: "text", value: "just ==one side" }]);
  });
});
