import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { remarkMark } from "./remark-mark";

// Sanitizer allowlist for rendered post bodies. rehype-highlight runs
// first and emits <code class="hljs language-*"> with <span class="hljs-*">
// token wrappers; those classes (and the <mark> tag from remark-mark)
// must survive sanitization, so they're explicitly permitted here.
export const POST_SCHEMA = {
  ...defaultSchema,
  tagNames: [...((defaultSchema.tagNames as string[]) || []), "mark"],
  attributes: {
    ...defaultSchema.attributes,
    code: [["className", /^language-./, "hljs", /^hljs-/]],
    span: [["className", "hljs", /^hljs-/]],
  },
};

// Plugin pipelines shared by the blog post route and its render tests so
// the two can't drift. Order matters: highlight before sanitize so the
// hljs classes exist when the allowlist is applied.
export const POST_REMARK_PLUGINS = [remarkGfm, remarkMark];
export const POST_REHYPE_PLUGINS = [
  rehypeHighlight,
  [rehypeSanitize, POST_SCHEMA],
] as const;
