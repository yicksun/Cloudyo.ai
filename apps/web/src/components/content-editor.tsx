"use client";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { z } from "zod";
import { catalog } from "@/lib/catalog";
import { documentSchema } from "@cloudyo/core";
import copyDefaults from "@/reference/copy.json";
import { adminRequest } from "./admin-console";

const revisionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  body: z.unknown(),
  createdAt: z.string(),
});
export function ContentEditor({
  record,
  onClose,
}: {
  record: Record<string, unknown> | null;
  onClose: () => void;
}) {
  const revisions = z.array(revisionSchema).parse(record?.revisions ?? []);
  const [revision, setRevision] = useState(revisions[0]);
  const [path, setPath] = useState(String(record?.path ?? "/resources/"));
  const [title, setTitle] = useState(revision?.title ?? "");
  const [description, setDescription] = useState(revision?.description ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const baseline = Object.hasOwn(catalog, path)
    ? catalog[path as keyof typeof catalog]
    : null;
  const defaults =
    baseline && baseline.component in copyDefaults
      ? copyDefaults[baseline.component as keyof typeof copyDefaults]
      : [];
  const body = z
    .object({
      content: z
        .array(
          z.object({
            content: z
              .array(z.object({ text: z.string().optional() }))
              .optional(),
          }),
        )
        .optional(),
    })
    .safeParse(revision?.body);
  const [copy, setCopy] = useState<string[]>(
    body.success
      ? (body.data.content?.map(
          (v) => v.content?.map((t) => t.text ?? "").join("") ?? "",
        ) ?? defaults)
      : defaults,
  );
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        codeBlock: false,
        underline: false,
        trailingNode: false,
      }),
    ],
    content: revision?.body
      ? documentSchema.parse(revision.body)
      : { type: "doc", content: [{ type: "paragraph" }] },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Page body",
        "aria-multiline": "true",
      },
    },
  });
  async function save() {
    setBusy(true);
    setError("");
    try {
      const data = {
        id: record?.id,
        version: record?.version ?? 0,
        path,
        title,
        description,
        body: baseline
          ? {
              type: "doc",
              content: copy.map((text) => ({
                type: "paragraph",
                content: text ? [{ type: "text", text }] : [],
              })),
            }
          : editor?.getJSON(),
      };
      await adminRequest("content", { action: "save", data });
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save draft.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function publish(id: string | null) {
    if (!record) return;
    setBusy(true);
    setError("");
    try {
      await adminRequest("content", {
        action: "publish",
        data: { id: record.id, version: record.version, revisionId: id },
      });
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not publish.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-card admin-editor">
      <h2>Content editor</h2>
      <label className="admin-field">
        Public URL path
        <input
          value={path}
          onChange={(e) => {
            const next = e.target.value;
            setPath(next);
            if (Object.hasOwn(catalog, next)) {
              const page = catalog[next as keyof typeof catalog];
              setTitle(page.title);
              setDescription(page.description);
              if (page.component in copyDefaults)
                setCopy(
                  copyDefaults[page.component as keyof typeof copyDefaults],
                );
            }
          }}
        />
      </label>
      {record?.publishedId ? (
        <p>
          Unpublish before changing the public URL. Draft text edits never
          replace the live saved revision.
        </p>
      ) : null}
      <label className="admin-field">
        Page title / SEO title
        <input
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="admin-field">
        Description
        <input
          value={description}
          maxLength={320}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      {baseline ? (
        <>
          <p>
            These fields preserve the original page structure. Edit the existing
            copy without adding or reordering layout blocks.
          </p>
          {copy.map((value, index) => (
            <label className="admin-field" key={index}>
              Copy block {index + 1}
              <textarea
                value={value}
                onChange={(e) =>
                  setCopy(
                    copy.map((old, i) => (i === index ? e.target.value : old)),
                  )
                }
              />
            </label>
          ))}
        </>
      ) : (
        <>
          <div className="admin-toolbar">
            <button
              type="button"
              className="admin-button secondary"
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              Bold
            </button>
            <button
              type="button"
              className="admin-button secondary"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              Italic
            </button>
            <button
              type="button"
              className="admin-button secondary"
              onClick={() =>
                editor?.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              Heading
            </button>
            <button
              type="button"
              className="admin-button secondary"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              List
            </button>
          </div>
          <EditorContent editor={editor} />
        </>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-toolbar">
        <button disabled={busy} className="admin-button" onClick={save}>
          Save new draft revision
        </button>
        <button
          disabled={busy}
          className="admin-button secondary"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      {revisions.length > 0 && (
        <>
          <h2>Revision history</h2>
          <select
            aria-label="Revision to restore or publish"
            value={revision?.id}
            onChange={(e) => {
              const selected = revisions.find((v) => v.id === e.target.value);
              if (!selected) return;
              setRevision(selected);
              setTitle(selected.title);
              setDescription(selected.description);
              const doc = z
                .object({
                  content: z
                    .array(
                      z.object({
                        content: z
                          .array(z.object({ text: z.string().optional() }))
                          .optional(),
                      }),
                    )
                    .optional(),
                })
                .parse(selected.body);
              setCopy(
                doc.content?.map(
                  (v) => v.content?.map((t) => t.text ?? "").join("") ?? "",
                ) ?? [],
              );
              editor?.commands.setContent(documentSchema.parse(selected.body));
            }}
          >
            {revisions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.createdAt} - {r.title}
              </option>
            ))}
          </select>
          <div className="admin-toolbar">
            <button
              disabled={busy}
              className="admin-button"
              onClick={() => revision && publish(revision.id)}
            >
              Publish selected saved revision
            </button>
            <button
              disabled={busy}
              className="admin-button secondary"
              onClick={() => publish(null)}
            >
              Unpublish
            </button>
          </div>
          <p>
            Publishing uses the saved revision, not unsaved edits. Save edits
            first, then reopen to publish.
          </p>
        </>
      )}
    </section>
  );
}
