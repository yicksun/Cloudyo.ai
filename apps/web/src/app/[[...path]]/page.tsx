import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import * as Reference from "@/reference/pages";
import { PublicShell } from "@/components/public-shell";
import {
  CopyProvider,
  ArticleProvider,
  ResourcesProvider,
} from "@/components/copy-provider";
import { RichContent } from "@/components/rich-content";
import { contentPage } from "@/lib/content";
import { referencePage } from "@/lib/catalog";
import { db } from "@cloudyo/data";
import { documentSchema } from "@cloudyo/core";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path?: string[] }> };
async function route(context: Context) {
  return "/" + ((await context.params).path ?? []).join("/");
}
export async function generateMetadata(context: Context): Promise<Metadata> {
  const path = await route(context);
  const content = await contentPage(path);
  const fallback = referencePage(path);
  const data = content?.published ?? fallback;
  return {
    title: data?.title ?? "Page not found",
    description: data?.description,
    alternates: { canonical: path },
    openGraph: {
      title: data?.title,
      description: data?.description,
      url: path,
      type: path.startsWith("/resources/") ? "article" : "website",
    },
    twitter: {
      card: "summary_large_image",
      title: data?.title,
      description: data?.description,
    },
    robots:
      content && !content.published
        ? { index: false, follow: false }
        : undefined,
  };
}
export default async function Page(context: Context) {
  const path = await route(context);
  const stored = await contentPage(path);
  if (process.env.PUBLIC_CONTENT_MODE !== "static") {
    const redirect = await db.redirect.findUnique({ where: { source: path } });
    if (redirect) permanentRedirect(redirect.destination);
  }
  if (stored && !stored.published) notFound();
  const baseline = referencePage(path);
  if (!stored?.published && !baseline) notFound();
  const published = stored?.published;
  let content: React.ReactNode;
  if (baseline && baseline.component !== "Article") {
    const Component = Reference[baseline.component];
    const body = published ? documentSchema.parse(published.body) : null;
    const copy =
      body?.content?.map(
        (paragraph) =>
          paragraph.content?.map((text) => text.text ?? "").join("") ?? "",
      ) ?? null;
    content = (
      <CopyProvider copy={copy}>
        <Component />
      </CopyProvider>
    );
  } else if (baseline?.component === "Article") {
    content = (
      <ArticleProvider
        value={
          published
            ? {
                title: published.title,
                description: published.description,
                body: documentSchema.parse(published.body),
              }
            : null
        }
      >
        <Reference.Article />
      </ArticleProvider>
    );
  } else if (published) {
    content = (
      <article className="content-document">
        <h1>{published.title}</h1>
        <p>{published.description}</p>
        <RichContent value={published.body} />
      </article>
    );
  } else {
    content = <Reference.Article />;
  }
  const resources =
    process.env.PUBLIC_CONTENT_MODE === "static"
      ? null
      : (
          await db.contentPage.findMany({
            where: { kind: "resource", publishedId: { not: null } },
            include: { published: true },
          })
        ).flatMap((page) =>
          page.published
            ? [
                {
                  path: page.path,
                  title: page.published.title,
                  description: page.published.description,
                },
              ]
            : [],
        );
  return (
    <PublicShell>
      <ResourcesProvider value={resources}>{content}</ResourcesProvider>
    </PublicShell>
  );
}
