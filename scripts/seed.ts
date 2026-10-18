import { db } from "@cloudyo/data";
import { catalog } from "../apps/web/src/lib/catalog";
import copy from "../apps/web/src/reference/copy.json";
import articles from "../apps/web/src/reference/articles.json";
import type { RichNode } from "@cloudyo/core";

function paragraph(text: string): RichNode {
  return { type: "paragraph", content: [{ type: "text", text }] };
}
async function seed(
  path: string,
  title: string,
  description: string,
  body: RichNode,
) {
  if (await db.contentPage.findUnique({ where: { path } })) return;
  await db.$transaction(async (tx) => {
    const page = await tx.contentPage.create({
      data: {
        path,
        kind: path.startsWith("/resources/") ? "resource" : "page",
      },
    });
    const revision = await tx.contentRevision.create({
      data: {
        pageId: page.id,
        title,
        description,
        body: JSON.parse(JSON.stringify(body)),
        author: "reference-import",
      },
    });
    await tx.contentPage.update({
      where: { id: page.id },
      data: { publishedId: revision.id },
    });
  });
}
try {
  for (const [path, page] of Object.entries(catalog)) {
    const defaults = copy[page.component as keyof typeof copy];
    await seed(path, page.title, page.description, {
      type: "doc",
      content: defaults.map(paragraph),
    });
  }
  for (const article of articles) {
    const content: RichNode[] = [];
    for (const section of article.sections) {
      content.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: section.heading }],
      });
      content.push(...section.body.map(paragraph));
      if ("bullets" in section && section.bullets)
        content.push({
          type: "bulletList",
          content: section.bullets.map((text) => ({
            type: "listItem",
            content: [paragraph(text)],
          })),
        });
    }
    await seed(`/resources/${article.slug}`, article.title, article.desc, {
      type: "doc",
      content,
    });
  }
  console.log(
    "Published reference content imported. Existing staff edits were not overwritten.",
  );
} finally {
  await db.$disconnect();
}
