"use client";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { permitted, topics, type Permission } from "@cloudyo/core";
import { StaffSignOut } from "./staff-signin";
import { ContentEditor } from "./content-editor";

const areas: Record<string, Permission> = {
  contacts: "business",
  partners: "business",
  content: "content",
  media: "content",
  subscribers: "subscribers",
  outbox: "retry",
  settings: "settings",
  audit: "settings",
};
type Row = Record<string, unknown>;
export async function adminRequest(
  path: string,
  body?: unknown,
): Promise<unknown> {
  const response = await fetch(
    `/api/admin/${path}`,
    body === undefined
      ? undefined
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const data: unknown = await response.json();
  if (!response.ok) {
    const error = z
      .object({ error: z.object({ message: z.string() }) })
      .safeParse(data);
    throw new Error(
      error.success ? error.data.error.message : "The operation failed.",
    );
  }
  return data;
}
function text(row: Row, key: string) {
  return row[key] === null || row[key] === undefined ? "" : String(row[key]);
}
export function AdminConsole({ roles }: { roles: string[] }) {
  const available = Object.keys(areas).filter((area) =>
    permitted(roles, areas[area]),
  );
  const [area, setArea] = useState(available[0] ?? "");
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Row | null | undefined>(undefined);
  const load = useCallback(async () => {
    if (!area) return;
    setLoading(true);
    setError("");
    try {
      const data = z
        .object({ records: z.array(z.record(z.string(), z.unknown())) })
        .parse(
          await adminRequest(
            `${area}?q=${encodeURIComponent(search)}&skip=${skip}`,
          ),
        );
      setRows(data.records);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load records.",
      );
    } finally {
      setLoading(false);
    }
  }, [area, search, skip]);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(body: unknown) {
    setError("");
    setMessage("");
    try {
      await adminRequest(area, body);
      setMessage("Saved.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save.");
    }
  }
  async function exportData() {
    setError("");
    try {
      const data = z
        .object({ csv: z.string() })
        .parse(await adminRequest("export", { area }));
      const url = URL.createObjectURL(
        new Blob([data.csv], { type: "text/csv" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `cloudyo-${area}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Export failed.");
    }
  }
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File)) return;
    try {
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "X-File-Name": encodeURIComponent(file.name),
          "X-Alt-Text": encodeURIComponent(String(form.get("alt") ?? "")),
        },
        body: file,
      });
      const data = z
        .object({
          message: z.string().optional(),
          error: z.object({ message: z.string() }).optional(),
        })
        .parse(await response.json());
      if (!response.ok)
        throw new Error(data.error?.message ?? "Upload failed.");
      setMessage(data.message ?? "Uploaded to quarantine.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed.");
    }
  }
  return (
    <div className="admin-workspace">
      <nav className="admin-nav" aria-label="Administration">
        {available.map((item) => (
          <button
            key={item}
            aria-current={item === area ? "page" : undefined}
            onClick={() => {
              setArea(item);
              setSkip(0);
              setQuery("");
              setSearch("");
              setEditing(undefined);
              setMessage("");
            }}
          >
            {item}
          </button>
        ))}
        <StaffSignOut />
      </nav>
      <section className="admin-main">
        {!area ? (
          <p role="alert">
            Your account has no assigned application role. Contact your
            organization administrator.
          </p>
        ) : (
          <>
            <h1>{area}</h1>
            <div className="admin-toolbar">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSkip(0);
                  setSearch(query);
                }}
              >
                <label>
                  Search or filter by status{" "}
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <button className="admin-button secondary">Search</button>
              </form>
              <button className="admin-button secondary" onClick={load}>
                Refresh
              </button>
              {["contacts", "partners", "subscribers"].includes(area) &&
                permitted(roles, "export") && (
                  <button
                    className="admin-button secondary"
                    onClick={exportData}
                  >
                    Export CSV
                  </button>
                )}
              {area === "content" && (
                <button
                  className="admin-button"
                  onClick={() => setEditing(null)}
                >
                  New page or resource
                </button>
              )}
            </div>
            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="admin-status" role="status">
                {message}
              </p>
            )}
            {loading && <p role="status">Loading...</p>}
            {area === "content" && editing !== undefined && (
              <ContentEditor
                key={editing ? text(editing, "id") : "new"}
                record={editing}
                onClose={() => {
                  setEditing(undefined);
                  void load();
                }}
              />
            )}
            {area === "media" && (
              <form onSubmit={upload} className="admin-card">
                <h2>Upload media</h2>
                <label className="admin-field">
                  File (PNG, JPEG, WebP, PDF; up to 10 MiB)
                  <input
                    name="file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    required
                  />
                </label>
                <label className="admin-field">
                  Alternative text
                  <input name="alt" maxLength={500} required />
                </label>
                <button className="admin-button">Upload to quarantine</button>
                <p>
                  Files remain private until a trusted malware scan approves
                  them.
                </p>
              </form>
            )}
            {!loading && rows.length === 0 && <p>No records found.</p>}
            {rows.map((row, index) => (
              <article
                className="admin-card"
                key={text(row, "id") || text(row, "key") || index}
              >
                <h2>
                  {text(row, "reference") ||
                    text(row, "path") ||
                    text(row, "email") ||
                    text(row, "name") ||
                    text(row, "key") ||
                    text(row, "action")}
                </h2>
                {["contacts", "partners"].includes(area) ? (
                  <>
                    <BusinessRecord row={row} area={area} save={save} />
                    {permitted(roles, "settings") && (
                      <PrivacyRecord row={row} area={area} done={load} />
                    )}
                  </>
                ) : (
                  <>
                    <dl>
                      {Object.entries(row)
                        .filter(
                          ([key, value]) =>
                            !["revisions", "consent", "value"].includes(key) &&
                            typeof value !== "object",
                        )
                        .map(([key, value]) => (
                          <div key={key} style={{ display: "contents" }}>
                            <dt>{key}</dt>
                            <dd>{String(value ?? "")}</dd>
                          </div>
                        ))}
                    </dl>
                    {area === "content" && (
                      <div className="admin-toolbar">
                        <button
                          className="admin-button"
                          onClick={() => setEditing(row)}
                        >
                          Edit and revisions
                        </button>
                        <a
                          className="admin-button secondary"
                          href={`/admin/preview/${text(row, "id")}`}
                        >
                          Preview draft
                        </a>
                      </div>
                    )}
                    {area === "media" && text(row, "status") === "Clean" && (
                      <button
                        className="admin-button"
                        onClick={() =>
                          void save({ id: row.id, action: "publish" })
                        }
                      >
                        Publish scanned file
                      </button>
                    )}
                    {area === "media" &&
                      text(row, "status") === "Published" && (
                        <a
                          className="admin-button secondary"
                          href={`/api/media/${text(row, "id")}`}
                        >
                          Published media URL
                        </a>
                      )}
                    {area === "outbox" &&
                      ["Failed", "Unknown"].includes(text(row, "state")) && (
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            void save({
                              id: row.id,
                              acknowledgeDuplicateRisk: true,
                            });
                          }}
                        >
                          <label>
                            <input type="checkbox" required /> I have reviewed
                            the outcome; retrying may send a duplicate email.
                          </label>
                          <button className="admin-button">
                            Retry reviewed message
                          </button>
                        </form>
                      )}
                    {area === "subscribers" && (
                      <>
                        <details>
                          <summary>Consent history</summary>
                          <pre>{JSON.stringify(row.consent, null, 2)}</pre>
                        </details>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const action = new FormData(e.currentTarget).get(
                              "action",
                            );
                            void save({
                              id: row.id,
                              action,
                              acknowledge: true,
                            });
                          }}
                        >
                          <label className="admin-field">
                            Privacy action
                            <select name="action">
                              <option value="suppress">
                                Suppress marketing
                              </option>
                              <option value="erase">
                                Erase identity, retain protected suppression key
                              </option>
                            </select>
                          </label>
                          <label>
                            <input type="checkbox" required /> I am authorized
                            to perform this privacy action.
                          </label>
                          <button className="admin-button">
                            Apply privacy action
                          </button>
                        </form>
                      </>
                    )}
                    {area === "settings" && (
                      <SettingsRecord row={row} save={save} />
                    )}
                  </>
                )}
              </article>
            ))}
            {area === "settings" &&
              !rows.some((r) => r.key === "recipients") && (
                <SettingsRecord
                  row={{ key: "recipients", value: {}, version: 0 }}
                  save={save}
                />
              )}
            {area === "settings" &&
              !rows.some((r) => r.key === "retention") && (
                <SettingsRecord
                  row={{ key: "retention", value: {}, version: 0 }}
                  save={save}
                />
              )}
            <div className="admin-toolbar">
              <button
                className="admin-button secondary"
                disabled={skip === 0}
                onClick={() => setSkip(Math.max(0, skip - 50))}
              >
                Previous
              </button>
              <span>Page {skip / 50 + 1}</span>
              <button
                className="admin-button secondary"
                disabled={rows.length < 50}
                onClick={() => setSkip(skip + 50)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
function BusinessRecord({
  row,
  area,
  save,
}: {
  row: Row;
  area: string;
  save: (value: unknown) => Promise<void>;
}) {
  const statuses =
    area === "contacts"
      ? ["New", "In Progress", "Closed"]
      : ["New", "In Review", "Approved", "Declined"];
  return (
    <>
      <dl>
        {Object.entries(row)
          .filter(
            ([key, value]) =>
              !["notes", "version", "status", "owner"].includes(key) &&
              typeof value !== "object",
          )
          .map(([key, value]) => (
            <div key={key} style={{ display: "contents" }}>
              <dt>{key}</dt>
              <dd>{String(value ?? "")}</dd>
            </div>
          ))}
      </dl>
      <details>
        <summary>Internal notes</summary>
        {z
          .array(
            z.object({ id: z.string(), body: z.string(), author: z.string() }),
          )
          .parse(row.notes ?? [])
          .map((note) => (
            <p key={note.id}>
              {note.body} <small>({note.author})</small>
            </p>
          ))}
      </details>
      <form
        key={text(row, "version")}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          void save({
            id: row.id,
            version: row.version,
            status: data.get("status"),
            owner: data.get("owner") || null,
            note: data.get("note"),
          });
        }}
      >
        <label className="admin-field">
          Status
          <select name="status" defaultValue={text(row, "status")}>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          Assigned owner (Entra staff identifier)
          <input
            name="owner"
            defaultValue={text(row, "owner")}
            maxLength={200}
          />
        </label>
        <label className="admin-field">
          Add internal note
          <textarea name="note" maxLength={5000} />
        </label>
        <button className="admin-button">Save changes</button>
      </form>
    </>
  );
}
function PrivacyRecord({
  row,
  area,
  done,
}: {
  row: Row;
  area: string;
  done: () => Promise<void>;
}) {
  const [error, setError] = useState("");
  const fields =
    area === "contacts"
      ? ["firstName", "lastName", "company", "email", "topic", "message"]
      : [
          "orgName",
          "contactName",
          "workEmail",
          "partnerType",
          "valueProposition",
        ];
  return (
    <details>
      <summary>Authorized privacy correction or erasure</summary>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          const data = new FormData(event.currentTarget);
          try {
            await adminRequest("privacy", {
              kind: area === "contacts" ? "contact" : "partner",
              id: row.id,
              version: row.version,
              action: data.get("action"),
              acknowledge: true,
              data: Object.fromEntries(
                fields.map((key) => [key, data.get(key)]),
              ),
            });
            await done();
          } catch (cause) {
            setError(
              cause instanceof Error
                ? cause.message
                : "The privacy action failed.",
            );
          }
        }}
      >
        {fields.map((field) => (
          <label key={field} className="admin-field">
            {field}
            <textarea
              name={field}
              defaultValue={text(row, field)}
              maxLength={5000}
            />
          </label>
        ))}
        <label className="admin-field">
          Action
          <select name="action">
            <option value="correct">Correct personal information</option>
            <option value="erase">
              Permanently erase record, notes, and outstanding notifications
            </option>
          </select>
        </label>
        <label>
          <input type="checkbox" required /> I have verified this request and
          applicable retention/legal hold obligations.
        </label>
        <button className="admin-button">
          Apply authorized privacy action
        </button>
      </form>
    </details>
  );
}
function SettingsRecord({
  row,
  save,
}: {
  row: Row;
  save: (value: unknown) => Promise<void>;
}) {
  const value = z.record(z.string(), z.unknown()).parse(row.value ?? {});
  const retention = row.key === "retention";
  const fields = retention
    ? ["enquiryDays", "auditDays"]
    : [...topics, "partnerships"];
  return (
    <form
      className="admin-card"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const result = Object.fromEntries(
          fields
            .map((key) => [
              key,
              retention ? Number(data.get(key)) : data.get(key),
            ])
            .filter(([, v]) => v !== ""),
        );
        void save({ key: row.key, version: row.version, value: result });
      }}
    >
      <h2>
        {retention
          ? "Approved retention schedule"
          : "Enquiry routing recipients"}
      </h2>
      {fields.map((key) => (
        <label key={key} className="admin-field">
          {key}
          {retention ? " (days)" : ""}
          <input
            name={key}
            type={retention ? "number" : "email"}
            min={1}
            required={retention}
            defaultValue={String(value[key] ?? "")}
          />
        </label>
      ))}
      {retention && (
        <p>
          Enter only the retention periods approved by your organization.
          Closed/completed records older than these periods are eligible for
          scheduled removal.
        </p>
      )}
      <button className="admin-button">
        Save {retention ? "approved schedule" : "routing"}
      </button>
    </form>
  );
}
