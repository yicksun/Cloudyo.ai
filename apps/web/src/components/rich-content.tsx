import { Fragment } from "react";
import { documentSchema, type RichNode } from "@cloudyo/core";

function node(value: RichNode, key: number): React.ReactNode {
  const children = value.content?.map(node);
  switch (value.type) {
    case "text": {
      let result: React.ReactNode = value.text ?? "";
      for (const mark of value.marks ?? []) {
        if (mark.type === "bold") result = <strong>{result}</strong>;
        if (mark.type === "italic") result = <em>{result}</em>;
        if (mark.type === "strike") result = <s>{result}</s>;
        if (mark.type === "code") result = <code>{result}</code>;
      }
      return <Fragment key={key}>{result}</Fragment>;
    }
    case "paragraph":
      return <p key={key}>{children}</p>;
    case "heading":
      return value.attrs?.level === 3 ? (
        <h3 key={key}>{children}</h3>
      ) : (
        <h2 key={key}>{children}</h2>
      );
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return (
        <ol
          key={key}
          start={value.attrs?.start}
          type={value.attrs?.type ?? undefined}
        >
          {children}
        </ol>
      );
    case "listItem":
      return <li key={key}>{children}</li>;
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    default:
      return <Fragment key={key}>{children}</Fragment>;
  }
}
export function RichContent({ value }: { value: unknown }) {
  return node(documentSchema.parse(value), 0);
}
