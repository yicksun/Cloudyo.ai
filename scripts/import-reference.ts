import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parse } from "@babel/parser";
import type traverseModule from "@babel/traverse";
import type generateModule from "@babel/generator";
import { createRequire } from "node:module";
import * as t from "@babel/types";
import path from "node:path";

const require = createRequire(import.meta.url);
const traverse: typeof traverseModule = require("@babel/traverse").default;
const generate: typeof generateModule = require("@babel/generator").default;
const source = await readFile(process.argv[2], "utf8");
const ast = parse(source, { sourceType: "module" });
const definitions = new Map<string, t.Statement>();
const icons = new Map<string, string>();
for (const statement of ast.program.body) {
  if (t.isFunctionDeclaration(statement) && statement.id)
    definitions.set(statement.id.name, statement);
  if (t.isVariableDeclaration(statement))
    for (const declaration of statement.declarations) {
      if (!t.isIdentifier(declaration.id)) continue;
      definitions.set(
        declaration.id.name,
        t.variableDeclaration(statement.kind, [declaration]),
      );
      if (
        t.isCallExpression(declaration.init) &&
        t.isIdentifier(declaration.init.callee, { name: "Ce" }) &&
        t.isStringLiteral(declaration.init.arguments[0])
      )
        icons.set(
          declaration.id.name,
          declaration.init.arguments[0].value
            .split("-")
            .map((v) => v[0].toUpperCase() + v.slice(1))
            .join(""),
        );
    }
}
const roots = {
  Header: "QM",
  Footer: "QR",
  Home: "x4",
  Expertise: "w4",
  Procurement: "T4",
  FinOps: "E4",
  Cloud: "N4",
  AI: "M4",
  Industries: "O4",
  Providers: "z4",
  Resources: "e6",
  Article: "i6",
  About: "s6",
  Contact: "o6",
  Partner: "c6",
  Privacy: "d6",
};
const adapters = new Set([
  "f",
  "S",
  "xt",
  "Ol",
  "je",
  "Xv",
  "ve",
  "I2",
  "qe",
  "$x",
  "ft",
  "Z4",
  "$w",
  "sr",
  "rr",
  "useReferenceRoute",
]);
const selected = new Map<string, t.Statement>();
const requiredIcons = new Map<string, string>();
const unknown = new Set<string>();
function include(name: string) {
  if (selected.has(name) || adapters.has(name)) return;
  if (icons.has(name)) {
    requiredIcons.set(name, icons.get(name)!);
    return;
  }
  const statement = definitions.get(name);
  if (!statement) return;
  if (
    (statement.start ??
      (t.isVariableDeclaration(statement)
        ? statement.declarations[0].start
        : 0) ??
      0) <
    source.indexOf("function QM") - 16000
  ) {
    unknown.add(name);
    return;
  }
  selected.set(name, statement);
  const file = t.file(t.program([t.cloneNode(statement, true)]));
  traverse(file, {
    ReferencedIdentifier(p) {
      if (!p.scope.hasBinding(p.node.name) && definitions.has(p.node.name))
        include(p.node.name);
    },
  });
}
Object.values(roots).forEach(include);
console.log("External adapters required:", [...unknown]);
if (unknown.size) process.exitCode = 1;
else {
  const declarations = [...selected.values()].sort((a, b) => {
    const position = (v: t.Statement) =>
      v.start ??
      (t.isVariableDeclaration(v) ? v.declarations[0].start : 0) ??
      0;
    return position(a) - position(b);
  });
  const recovered = t.file(t.program(declarations));
  traverse(recovered, {
    ObjectExpression(p) {
      const fn = p.findParent(
        (v) =>
          v.isFunctionDeclaration() &&
          ["QM", "QR"].includes(v.node.id?.name ?? ""),
      );
      const properties = p.node.properties.filter((v): v is t.ObjectProperty =>
        t.isObjectProperty(v),
      );
      const property = (name: string) =>
        properties.find((v) => t.isIdentifier(v.key, { name }));
      const classes = property("className");
      if (classes && t.isStringLiteral(classes.value)) {
        const brand = classes.value.value.includes("#FF9900")
          ? "Amazon Web Services"
          : classes.value.value.includes("#0089D6")
            ? "Microsoft Azure"
            : classes.value.value.includes("#4285F4")
              ? "Google Cloud"
              : null;
        if (brand) {
          p.node.properties.push(
            t.objectProperty(t.identifier("role"), t.stringLiteral("img")),
          );
          p.node.properties.push(
            t.objectProperty(
              t.stringLiteral("aria-label"),
              t.stringLiteral(brand),
            ),
          );
        }
      }
      if (!fn?.isFunctionDeclaration()) return;
      if (fn.node.id?.name === "QM" && property("onMouseEnter")) {
        p.node.properties.push(
          t.objectProperty(
            t.identifier("onFocus"),
            t.cloneNode(property("onMouseEnter")!.value),
          ),
        );
        p.node.properties.push(
          t.objectProperty(
            t.identifier("onBlur"),
            t.arrowFunctionExpression(
              [t.identifier("event")],
              t.blockStatement([
                t.ifStatement(
                  t.unaryExpression(
                    "!",
                    t.callExpression(
                      t.memberExpression(
                        t.memberExpression(
                          t.identifier("event"),
                          t.identifier("currentTarget"),
                        ),
                        t.identifier("contains"),
                      ),
                      [
                        t.memberExpression(
                          t.identifier("event"),
                          t.identifier("relatedTarget"),
                        ),
                      ],
                    ),
                  ),
                  t.expressionStatement(
                    t.callExpression(t.identifier("u"), [t.nullLiteral()]),
                  ),
                ),
              ]),
            ),
          ),
        );
        p.node.properties.push(
          t.objectProperty(
            t.identifier("onKeyDown"),
            t.arrowFunctionExpression(
              [t.identifier("event")],
              t.blockStatement([
                t.ifStatement(
                  t.binaryExpression(
                    "===",
                    t.memberExpression(
                      t.identifier("event"),
                      t.identifier("key"),
                    ),
                    t.stringLiteral("Escape"),
                  ),
                  t.expressionStatement(
                    t.callExpression(t.identifier("u"), [t.nullLiteral()]),
                  ),
                ),
              ]),
            ),
          ),
        );
      }
      if (
        fn.node.id?.name === "QM" &&
        property("onClick") &&
        property("className") &&
        generate(property("className")!.value).code.includes("lg:hidden")
      ) {
        p.node.properties.push(
          t.objectProperty(
            t.stringLiteral("aria-label"),
            t.stringLiteral("Toggle navigation"),
          ),
        );
        p.node.properties.push(
          t.objectProperty(t.stringLiteral("aria-expanded"), t.identifier("r")),
        );
      }
      if (fn.node.id?.name === "QR") {
        const children = property("children"),
          href = property("href");
        if (href && children && t.isStringLiteral(children.value)) {
          if (children.value.value === "Terms of Service")
            href.value = t.stringLiteral("/terms");
          if (children.value.value === "Cookie Policy")
            href.value = t.stringLiteral("/cookies");
        }
        if (href && t.isStringLiteral(href.value, { value: "#" })) {
          const call = p.parentPath.node;
          if (t.isCallExpression(call))
            call.arguments[0] = t.stringLiteral("span");
          p.node.properties = p.node.properties.filter((v) => v !== href);
        }
      }
    },
    CallExpression(p) {
      if (
        t.isIdentifier(p.node.arguments[0], { name: "Ew" }) &&
        t.isObjectExpression(p.node.arguments[1])
      ) {
        p.node.arguments[1].properties.push(
          t.objectProperty(t.identifier("role"), t.stringLiteral("heading")),
          t.objectProperty(t.stringLiteral("aria-level"), t.numericLiteral(3)),
        );
      }
      if (
        !t.isMemberExpression(p.node.callee) ||
        !t.isIdentifier(p.node.callee.object, { name: "f" }) ||
        !t.isStringLiteral(p.node.arguments[0], { value: "form" })
      )
        return;
      const parent = p.getFunctionParent();
      const fn = parent?.node;
      if (!t.isFunctionDeclaration(fn) || !fn.id) return;
      const kind = { QR: "newsletter", o6: "contact", c6: "partner" }[
        fn.id.name
      ];
      if (!kind) return;
      p.replaceWith(
        t.callExpression(
          t.memberExpression(t.identifier("f"), t.identifier("jsx")),
          [
            t.identifier(
              kind === "newsletter" ? "NewsletterForm" : "BusinessForm",
            ),
            t.objectExpression([
              t.objectProperty(t.identifier("kind"), t.stringLiteral(kind)),
            ]),
          ],
        ),
      );
    },
    ConditionalExpression: {
      exit(p) {
        const fn = p.getFunctionParent()?.node;
        if (
          !t.isFunctionDeclaration(fn) ||
          !fn.id ||
          !["QR", "o6", "c6"].includes(fn.id.name)
        )
          return;
        if (
          t.isBinaryExpression(p.node.test) &&
          t.isStringLiteral(p.node.test.right, { value: "success" })
        )
          p.replaceWith(p.node.alternate);
      },
    },
  });
  for (const fn of recovered.program.body) {
    if (
      t.isFunctionDeclaration(fn) &&
      fn.id &&
      ["QR", "o6", "c6"].includes(fn.id.name)
    ) {
      fn.body.body = fn.body.body.filter(
        (statement) => !t.isVariableDeclaration(statement),
      );
      if (fn.id.name === "QR")
        fn.body.body.unshift(
          t.variableDeclaration("const", [
            t.variableDeclarator(
              t.identifier("t"),
              t.callExpression(
                t.memberExpression(
                  t.newExpression(t.identifier("Date"), []),
                  t.identifier("getFullYear"),
                ),
                [],
              ),
            ),
          ]),
        );
    }
  }
  const editableRoots = new Set(
    Object.values(roots).filter((v) => !["QM", "QR", "i6"].includes(v)),
  );
  const copy: Record<string, string[]> = {};
  traverse(recovered, {
    ReferencedIdentifier(p) {
      if (p.node.name !== "Ml") return;
      const fn = p.findParent(
        (v) =>
          v.isFunctionDeclaration() &&
          ["e6", "i6"].includes(v.node.id?.name ?? ""),
      );
      if (fn) p.replaceWith(t.identifier("resourceCatalog"));
    },
    CallExpression(p) {
      if (t.isIdentifier(p.node.callee, { name: "W4" })) {
        p.replaceWith(
          t.callExpression(t.identifier("useArticle"), [t.cloneNode(p.node)]),
        );
        p.skip();
      }
    },
    ObjectProperty(p) {
      if (
        t.isIdentifier(p.node.key, { name: "href" }) &&
        t.isStringLiteral(p.node.value, { value: "/contact" })
      ) {
        const topics: Record<string, string> = {
          T4: "Software Procurement Advisory",
          E4: "IT Cost Management / FinOps",
          N4: "Cloud Migration Services",
          M4: "Data & AI Solutions",
        };
        const page = p.findParent(
          (v) =>
            v.isFunctionDeclaration() &&
            Boolean(v.node.id && topics[v.node.id.name]),
        );
        if (page?.isFunctionDeclaration() && page.node.id)
          p.node.value = t.stringLiteral(
            `/contact?topic=${encodeURIComponent(topics[page.node.id.name])}`,
          );
      }
      if (
        t.isIdentifier(p.node.key, { name: "children" }) &&
        t.isCallExpression(p.node.value) &&
        t.isMemberExpression(p.node.value.callee) &&
        t.isMemberExpression(p.node.value.callee.object) &&
        t.isIdentifier(p.node.value.callee.object.property, {
          name: "sections",
        })
      ) {
        p.node.value = t.callExpression(
          t.memberExpression(t.identifier("f"), t.identifier("jsx")),
          [
            t.identifier("ArticleBody"),
            t.objectExpression([
              t.objectProperty(t.identifier("children"), p.node.value),
            ]),
          ],
        );
        p.skip();
        return;
      }
      if (
        !t.isIdentifier(p.node.key, { name: "children" }) ||
        !t.isStringLiteral(p.node.value) ||
        !p.node.value.value.trim()
      )
        return;
      const fn = p.findParent(
        (v) =>
          v.isFunctionDeclaration() &&
          Boolean(v.node.id && editableRoots.has(v.node.id.name)),
      );
      if (!fn?.isFunctionDeclaration() || !fn.node.id) return;
      const list = (copy[fn.node.id.name] ??= []);
      const index = list.length;
      const fallback = p.node.value.value;
      list.push(fallback);
      p.node.value = t.callExpression(
        t.memberExpression(t.identifier("f"), t.identifier("jsx")),
        [
          t.identifier("EditableCopy"),
          t.objectExpression([
            t.objectProperty(t.identifier("index"), t.numericLiteral(index)),
            t.objectProperty(
              t.identifier("fallback"),
              t.stringLiteral(fallback),
            ),
          ]),
        ],
      );
      p.skip();
    },
  });
  for (const fn of recovered.program.body) {
    if (t.isFunctionDeclaration(fn) && ["e6", "i6"].includes(fn.id?.name ?? ""))
      fn.body.body.unshift(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("resourceCatalog"),
            t.callExpression(t.identifier("useResources"), [
              t.identifier("Ml"),
            ]),
          ),
        ]),
      );
  }
  const imports = `"use client";\n// Public Cloudyo components recovered from the owner-designated reference site.\nimport * as S from "react";\nimport * as xt from "react";\nimport * as f from "react/jsx-runtime";\nimport { motion as je, AnimatePresence as Xv } from "framer-motion";\nimport { Link as ve, useLocation as I2, Button as qe, useReferenceRoute as $x, cx as ft, Tabs as Z4, TabsList as $w, TabsTrigger as sr, TabsContent as rr } from "../components/reference-adapters";\nimport { BusinessForm, NewsletterForm } from "../components/forms";\nimport { EditableCopy, useArticle, useResources, ArticleBody } from "../components/copy-provider";\nimport { ${[...requiredIcons].map(([alias, original]) => `${original} as ${alias}`).join(", ")} } from "lucide-react";\n`;
  const output =
    imports +
    recovered.program.body.map((v) => generate(v).code).join("\n") +
    `\nexport { ${Object.entries(roots)
      .map(([name, original]) => `${original} as ${name}`)
      .join(", ")} };\n`;
  const directory = path.resolve("apps/web/src/reference");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "pages.jsx"), output);
  await writeFile(
    path.join(directory, "copy.json"),
    JSON.stringify(
      Object.fromEntries(
        Object.entries(roots).map(([key, value]) => [key, copy[value] ?? []]),
      ),
      null,
      2,
    ),
  );
  let articleJson: string | undefined;
  traverse(ast, {
    VariableDeclarator(p) {
      if (!t.isIdentifier(p.node.id, { name: "Ml" })) return;
      const result = p.get("init").evaluate();
      if (!result.confident)
        throw new Error("Reference article data is not a static literal.");
      articleJson = JSON.stringify(result.value, null, 2);
    },
  });
  if (!articleJson)
    throw new Error("Reference resource content was not found.");
  await writeFile(path.join(directory, "articles.json"), articleJson);
  const publicDir = path.resolve("apps/web/public");
  await mkdir(path.join(publicDir, "fonts"), { recursive: true });
  const cssResponse = await fetch(
    "https://cloudyo.ai/assets/index-Byum0Mqr.css",
  );
  if (!cssResponse.ok) throw new Error("Reference stylesheet download failed.");
  const css = (await cssResponse.text()).replace(/@import"[^"]+";/g, "");
  await writeFile(path.join(publicDir, "reference.css"), css);
  const assets = [
    "/hero-bg.png",
    "/industries-visual.png",
    "/about-team.png",
    "/favicon.svg",
  ];
  for (const asset of assets) {
    const response = await fetch(`https://cloudyo.ai${asset}`);
    if (!response.ok) throw new Error(`Asset download failed: ${asset}`);
    await writeFile(
      path.join(publicDir, asset.slice(1)),
      Buffer.from(await response.arrayBuffer()),
    );
  }
  const font = await fetch(
    "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIoaomQNQcsA88c7O9yZ4KMCoOg4Ko20yw.woff2",
  );
  if (!font.ok) throw new Error("Reference font download failed.");
  await writeFile(
    path.join(publicDir, "fonts", "plus-jakarta-sans.woff2"),
    Buffer.from(await font.arrayBuffer()),
  );
  console.log(
    `Recovered ${declarations.length} public component/content declarations and ${requiredIcons.size} icon imports.`,
  );
}
