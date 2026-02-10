import { Node, mergeAttributes } from "@tiptap/core";

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "inline*",
  defining: true,
  addAttributes() {
    return {
      type: { default: "info" }
    };
  },
  parseHTML() {
    return [{ tag: "aside.callout" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["aside", mergeAttributes(HTMLAttributes, { class: "callout" }), 0];
  }
});
