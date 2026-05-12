import type { Plugin } from "unified";
import type { Root, Text, Parent, PhrasingContent } from "mdast";
import { visit } from "unist-util-visit";

const PATTERN = /==([^=\n]+?)==/g;

/**
 * Markdown extension: `==text==` renders as `<mark>text</mark>`.
 * Pairs with the .sd-post-body mark CSS rule to give authors a way to
 * apply the acid accent color to inline copy without also italicizing
 * it the way *em* does.
 */
export const remarkMark: Plugin<[], Root> = () => (tree) => {
  visit(tree, "text", (node, index, parent) => {
    if (!parent || index == null) return;
    const text = (node as Text).value;
    if (!text.includes("==")) return;

    PATTERN.lastIndex = 0;
    const parts: PhrasingContent[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = PATTERN.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (start > cursor) {
        parts.push({ type: "text", value: text.slice(cursor, start) });
      }
      parts.push({
        type: "emphasis",
        data: { hName: "mark" },
        children: [{ type: "text", value: match[1] }],
      } as PhrasingContent);
      cursor = end;
    }

    if (cursor === 0) return;
    if (cursor < text.length) {
      parts.push({ type: "text", value: text.slice(cursor) });
    }

    (parent as Parent).children.splice(index, 1, ...parts);
    return index + parts.length;
  });
};
