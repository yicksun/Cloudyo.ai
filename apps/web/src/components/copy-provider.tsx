"use client";
import { createContext, useContext } from "react";
import type { RichNode } from "@cloudyo/core";
import { RichContent } from "./rich-content";

const CopyContext = createContext<string[] | null>(null);
export function CopyProvider({
  copy,
  children,
}: {
  copy: string[] | null;
  children: React.ReactNode;
}) {
  return <CopyContext.Provider value={copy}>{children}</CopyContext.Provider>;
}
export function EditableCopy({
  index,
  fallback,
}: {
  index: number;
  fallback: string;
}) {
  const copy = useContext(CopyContext);
  return copy?.[index] ?? fallback;
}
interface ArticleOverride {
  title: string;
  description: string;
  body: RichNode;
}
const ArticleContext = createContext<ArticleOverride | null>(null);
export function ArticleProvider({
  value,
  children,
}: {
  value: ArticleOverride | null;
  children: React.ReactNode;
}) {
  return (
    <ArticleContext.Provider value={value}>{children}</ArticleContext.Provider>
  );
}
export function useArticle<
  T extends {
    title: string;
    desc: string;
    sections: { heading: string; body: string[]; bullets?: string[] }[];
  },
>(fallback: T | undefined) {
  const override = useContext(ArticleContext);
  if (!fallback || !override) return fallback;
  const sections: T["sections"] = [];
  for (const block of override.body.content ?? []) {
    const text = block.content?.map((v) => v.text ?? "").join("") ?? "";
    if (block.type === "heading") sections.push({ heading: text, body: [] });
    else {
      const current = sections.at(-1) ?? { heading: "", body: [] };
      if (!sections.length) sections.push(current);
      if (block.type === "bulletList")
        current.bullets =
          block.content?.map(
            (v) =>
              v.content
                ?.flatMap((p) => p.content?.map((n) => n.text ?? "") ?? [])
                .join("") ?? "",
          ) ?? [];
      else current.body.push(text);
    }
  }
  return {
    ...fallback,
    title: override.title,
    desc: override.description,
    sections,
  };
}

export interface ResourceSummary {
  path: string;
  title: string;
  description: string;
}
export function ArticleBody({ children }: { children: React.ReactNode }) {
  const article = useContext(ArticleContext);
  const complex = (node: RichNode): boolean =>
    Boolean(node.marks?.length) ||
    ["orderedList", "blockquote", "hardBreak", "horizontalRule"].includes(
      node.type,
    ) ||
    (node.type === "heading" && node.attrs?.level !== 2) ||
    Boolean(node.content?.some(complex));
  return article && complex(article.body) ? (
    <div className="article-rich-body">
      <RichContent value={article.body} />
    </div>
  ) : (
    children
  );
}
const ResourceContext = createContext<ResourceSummary[] | null>(null);
export function ResourcesProvider({
  value,
  children,
}: {
  value: ResourceSummary[] | null;
  children: React.ReactNode;
}) {
  return (
    <ResourceContext.Provider value={value}>
      {children}
    </ResourceContext.Provider>
  );
}
export function useResources<
  T extends {
    slug: string;
    title: string;
    desc: string;
    type: string;
    date: string;
  },
>(fallback: T[]) {
  const entries = useContext(ResourceContext);
  if (!entries) return fallback;
  const mapped = entries.map((entry) => {
    const existing = fallback.find(
      (v) => `/resources/${v.slug}` === entry.path,
    );
    return {
      ...(existing ?? {}),
      slug: entry.path.slice("/resources/".length),
      title: entry.title,
      desc: entry.description,
      type: existing?.type ?? "blog",
      date: existing?.date ?? "",
    };
  });
  return mapped.sort((a, b) => {
    const index = (slug: string) => {
      const i = fallback.findIndex((v) => v.slug === slug);
      return i === -1 ? fallback.length : i;
    };
    return index(a.slug) - index(b.slug);
  });
}
