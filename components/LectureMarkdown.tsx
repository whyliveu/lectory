"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

type Props = {
  markdown: string;
};

function nodeToPlainText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToPlainText).join("");
  if (typeof node === "object" && node !== null && "props" in node) {
    const el = node as { props?: { children?: ReactNode } };
    return nodeToPlainText(el.props?.children);
  }
  return "";
}

const readerComponents: Partial<Components> = {
  h2: ({ children, className, ...rest }) => {
    const text = nodeToPlainText(children).trim();
    let variant = "";
    if (/что важно запомнить к экзамену/i.test(text)) {
      variant = " lecture-markdown-h2--exam";
    } else if (/короткая выжимка/i.test(text)) {
      variant = " lecture-markdown-h2--summary";
    }
    const merged = [className, variant].filter(Boolean).join(" ");
    return (
      <h2 {...rest} className={merged || undefined}>
        {children}
      </h2>
    );
  },
};

export function LectureMarkdown({ markdown }: Props) {
  return (
    <div className="lecture-markdown lecture-markdown--reader">
      <ReactMarkdown components={readerComponents}>{markdown}</ReactMarkdown>
    </div>
  );
}
