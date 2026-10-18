import { db } from "@cloudyo/data";
import { staff } from "@/lib/auth";
import { RichContent } from "@/components/rich-content";
import { CopyProvider, ArticleProvider } from "@/components/copy-provider";
import { PublicShell } from "@/components/public-shell";
import { referencePage } from "@/lib/catalog";
import * as Reference from "@/reference/pages";
import { documentSchema } from "@cloudyo/core";
import { AppError } from "@cloudyo/core";
import { z } from "zod";
import { ReferenceRouteProvider } from "@/components/reference-adapters";
import { notFound, redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Private draft preview",
  robots: { index: false, follow: false },
};
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await staff("content");
  } catch (error) {
    if (error instanceof AppError && error.status === 401) redirect("/admin");
    if (error instanceof AppError && error.status === 403) notFound();
    throw error;
  }
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const page = await db.contentPage.findUnique({
    where: { id },
    include: { revisions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const revision = page?.revisions[0];
  if (!page || !revision) notFound();
  const baseline = referencePage(page.path);
  const body = documentSchema.parse(revision.body);
  let content: React.ReactNode;
  if (baseline?.component === "Article")
    content = (
      <ArticleProvider
        value={{
          title: revision.title,
          description: revision.description,
          body,
        }}
      >
        <Reference.Article />
      </ArticleProvider>
    );
  else if (baseline) {
    const Component = Reference[baseline.component];
    content = (
      <CopyProvider
        copy={
          body.content?.map(
            (p) => p.content?.map((n) => n.text ?? "").join("") ?? "",
          ) ?? []
        }
      >
        <Component />
      </CopyProvider>
    );
  } else
    content = (
      <article className="content-document">
        <h1>{revision.title}</h1>
        <p>{revision.description}</p>
        <RichContent value={body} />
      </article>
    );
  return (
    <ReferenceRouteProvider path={page.path}>
      <div
        role="status"
        style={{
          position: "fixed",
          bottom: 0,
          zIndex: 100,
          padding: "1rem",
          background: "#fff7ed",
          color: "#052b34",
        }}
      >
        Private preview - not published.{" "}
        <a href="/admin">Return to administration</a>
      </div>
      <PublicShell>{content}</PublicShell>
    </ReferenceRouteProvider>
  );
}
