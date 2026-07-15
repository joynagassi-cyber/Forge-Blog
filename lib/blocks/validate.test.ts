import { describe, expect, it } from "vitest";
import { emptyArticleContent } from "./types";
import {
  extractToc,
  isValidArticleContent,
  validateArticleContent,
} from "./validate";

describe("validateArticleContent", () => {
  it("accepts empty scaffold", () => {
    const content = emptyArticleContent();
    const issues = validateArticleContent(content);
    expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(isValidArticleContent(content)).toBe(true);
  });

  it("rejects wrong sequence order", () => {
    const content = emptyArticleContent();
    // swap first two
    const [a, b, ...rest] = content.sequence;
    content.sequence = [b, a, ...rest];
    const errors = validateArticleContent(content).filter(
      (i) => i.severity === "error"
    );
    expect(errors.some((e) => e.code === "scaffold_order")).toBe(true);
  });

  it("rejects more than one product_bridge_inline", () => {
    const content = emptyArticleContent();
    const body = content.sequence.find((b) => b.type === "body_blocks");
    if (body && body.type === "body_blocks") {
      body.blocks = [
        {
          id: "b1",
          type: "product_bridge_inline",
          product: "nainoforge",
          headline: "h",
          body: "b",
          ctaLabel: "c",
          ctaHref: "#",
        },
        {
          id: "b2",
          type: "product_bridge_inline",
          product: "scyforge",
          headline: "h",
          body: "b",
          ctaLabel: "c",
          ctaHref: "#",
        },
      ];
    }
    const errors = validateArticleContent(content).filter(
      (i) => i.severity === "error"
    );
    expect(errors.some((e) => e.code === "too_many_bridges")).toBe(true);
  });

  it("extracts TOC from h2/h3", () => {
    const content = emptyArticleContent();
    const body = content.sequence.find((b) => b.type === "body_blocks");
    if (body && body.type === "body_blocks") {
      body.blocks = [
        { id: "1", type: "h2", text: "One", anchor: "one" },
        { id: "2", type: "h3", text: "Two", anchor: "two" },
        { id: "3", type: "paragraph", spans: [{ text: "x" }] },
      ];
    }
    const toc = extractToc(content);
    expect(toc).toEqual([
      { id: "one", text: "One", level: 2 },
      { id: "two", text: "Two", level: 3 },
    ]);
  });
});
