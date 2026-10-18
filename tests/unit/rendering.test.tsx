// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { BusinessForm } from "../../apps/web/src/components/forms";
import { RichContent } from "../../apps/web/src/components/rich-content";
import {
  ArticleProvider,
  ArticleBody,
} from "../../apps/web/src/components/copy-provider";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("public form feedback", () => {
  it("associates validation errors with fields and does not send invalid input", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { container } = render(<BusinessForm kind="contact" />);
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() =>
      expect(
        screen.getByLabelText("First Name").getAttribute("aria-invalid"),
      ).toBe("true"),
    );
    const field = screen.getByLabelText("First Name");
    expect(
      document.getElementById(field.getAttribute("aria-describedby")!)
        ?.textContent,
    ).toBe("This field is required.");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("keeps the submission key through a transport failure and confirms only durable acceptance", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Synthetic offline"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ reference: "CLY-SYNTHETIC" }), {
          status: 202,
        }),
      );
    vi.stubGlobal("fetch", fetch);
    const { container } = render(<BusinessForm kind="contact" />);
    for (const [label, value] of [
      ["First Name", "Test"],
      ["Last Name", "Reader"],
      ["Work Email", "reader@cloudyo.example"],
      ["Message", "Synthetic component test"],
    ])
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.submit(container.querySelector("form")!);
    await screen.findByRole("alert");
    expect(screen.queryByText("Message received!")).toBeNull();
    fireEvent.submit(container.querySelector("form")!);
    await screen.findByText("Message received!");
    expect(screen.getByText("Reference: CLY-SYNTHETIC")).not.toBeNull();
    expect(fetch.mock.calls[0][1].headers["Idempotency-Key"]).toBe(
      fetch.mock.calls[1][1].headers["Idempotency-Key"],
    );
  });
});
it("preserves rich formatting in original resource templates as well as new content", () => {
  const { container } = render(
    <ArticleProvider
      value={{
        title: "Synthetic",
        description: "Synthetic",
        body: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Article emphasis",
                  marks: [{ type: "bold" }],
                },
              ],
            },
          ],
        },
      }}
    >
      <ArticleBody>Plain fallback</ArticleBody>
    </ArticleProvider>,
  );
  expect(container.querySelector("strong")?.textContent).toBe(
    "Article emphasis",
  );
  expect(screen.queryByText("Plain fallback")).toBeNull();
});
it("renders allowed structured formatting without executing submitted HTML", () => {
  const { container } = render(
    <RichContent
      value={{
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "<script>alert(1)</script>",
                marks: [{ type: "bold" }],
              },
            ],
          },
          {
            type: "orderedList",
            attrs: { start: 3, type: null },
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Ordered item" }],
                  },
                ],
              },
            ],
          },
        ],
      }}
    />,
  );
  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector("strong")?.textContent).toBe(
    "<script>alert(1)</script>",
  );
  expect(container.querySelector("ol li")?.textContent).toBe("Ordered item");
  expect(container.querySelector("ol")?.getAttribute("start")).toBe("3");
});
