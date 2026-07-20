import { describe, expect, it } from "vitest";
import { emptyArticleContent } from "./types";
import type { BodyBlock } from "./types";
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

  it("rejects unknown body block types", () => {
    const content = emptyArticleContent();
    const body = content.sequence.find((b) => b.type === "body_blocks");
    if (body && body.type === "body_blocks") {
      body.blocks = [
        { id: "b1", type: "unknown_type" } as unknown as BodyBlock,
      ];
    }
    const errors = validateArticleContent(content).filter(
      (i) => i.severity === "error"
    );
    expect(errors.some((e) => e.code === "unknown_body_type")).toBe(true);
  });

  it("rejects body block without id", () => {
    const content = emptyArticleContent();
    const body = content.sequence.find((b) => b.type === "body_blocks");
    if (body && body.type === "body_blocks") {
      body.blocks = [
        { type: "paragraph", spans: [{ text: "hello" }] } as unknown as BodyBlock,
      ];
    }
    const errors = validateArticleContent(content).filter(
      (i) => i.severity === "error"
    );
    expect(errors.some((e) => e.code === "missing_id")).toBe(true);
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

  describe("image blocks", () => {
    it("warns when image lacks alt text", () => {
      const content = emptyArticleContent();
      const body = content.sequence.find((b) => b.type === "body_blocks");
      if (body && body.type === "body_blocks") {
        body.blocks = [
          { id: "img1", type: "image", src: "/photo.jpg", alt: "" } as BodyBlock,
        ];
      }
      const warnings = validateArticleContent(content).filter(
        (i) => i.code === "image_alt"
      );
      expect(warnings).toHaveLength(1);
    });

    it("errors when image lacks src", () => {
      const content = emptyArticleContent();
      const body = content.sequence.find((b) => b.type === "body_blocks");
      if (body && body.type === "body_blocks") {
        body.blocks = [
          {
            id: "img2",
            type: "image",
            src: "",
            alt: "A photo",
          } as BodyBlock,
        ];
      }
      const errors = validateArticleContent(content).filter(
        (i) => i.code === "image_src"
      );
      expect(errors).toHaveLength(1);
    });

    it("accepts valid image with src and alt", () => {
      const content = emptyArticleContent();
      const body = content.sequence.find((b) => b.type === "body_blocks");
      if (body && body.type === "body_blocks") {
        body.blocks = [
          {
            id: "img3",
            type: "image",
            src: "/photo.jpg",
            alt: "A nice photo",
            caption: "A nice photo indeed",
          } as BodyBlock,
        ];
      }
      const errors = validateArticleContent(content).filter(
        (i) => i.severity === "error"
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("code blocks", () => {
    it("warns when code block lacks language tag", () => {
      const content = emptyArticleContent();
      const body = content.sequence.find((b) => b.type === "body_blocks");
      if (body && body.type === "body_blocks") {
        body.blocks = [
          { id: "c1", type: "code", language: "", code: "print('hi')" } as BodyBlock,
        ];
      }
      const warnings = validateArticleContent(content).filter(
        (i) => i.code === "code_language"
      );
      expect(warnings).toHaveLength(1);
    });

    it("accepts code block with language", () => {
      const content = emptyArticleContent();
      const body = content.sequence.find((b) => b.type === "body_blocks");
      if (body && body.type === "body_blocks") {
        body.blocks = [
          { id: "c2", type: "code", language: "python", code: "print('hi')" } as BodyBlock,
        ];
      }
      const warnings = validateArticleContent(content).filter(
        (i) => i.code === "code_language"
      );
      expect(warnings).toHaveLength(0);
    });
  });

  describe("diagram blocks", () => {
    it("errors when diagram lacks nodes/edges", () => {
      const content = emptyArticleContent();
      const body = content.sequence.find((b) => b.type === "body_blocks");
      if (body && body.type === "body_blocks") {
        body.blocks = [
          {
            id: "d1",
            type: "diagram",
          } as unknown as BodyBlock,
        ];
      }
      const errors = validateArticleContent(content).filter(
        (i) => i.code === "diagram_shape"
      );
      expect(errors).toHaveLength(1);
    });

    it("accepts valid diagram with nodes and edges", () => {
      const content = emptyArticleContent();
      const body = content.sequence.find((b) => b.type === "body_blocks");
      if (body && body.type === "body_blocks") {
        body.blocks = [
          {
            id: "d2",
            type: "diagram",
            nodes: [{ id: "n1", label: "Start", type: "step" }],
            edges: [{ id: "e1", source: "n1", target: "n1" }],
          } as BodyBlock,
        ];
      }
      const errors = validateArticleContent(content).filter(
        (i) => i.code === "diagram_shape"
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("mermaid blocks", () => {
    it("accepts mermaid block with definition", () => {
      const content = emptyArticleContent();
      const body = content.sequence.find((b) => b.type === "body_blocks");
      if (body && body.type === "body_blocks") {
        body.blocks = [
          {
            id: "m1",
            type: "mermaid",
            definition: "graph TD; A-->B;",
            title: "Flow",
          } as BodyBlock,
        ];
      }
      const errors = validateArticleContent(content).filter(
        (i) => i.severity === "error"
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("equation blocks", () => {
    it("accepts equation block with latex", () => {
      const content = emptyArticleContent();
      const body = content.sequence.find((b) => b.type === "body_blocks");
      if (body && body.type === "body_blocks") {
        body.blocks = [
          {
            id: "e1",
            type: "equation",
            latex: "E = mc^2",
          } as BodyBlock,
        ];
      }
      const errors = validateArticleContent(content).filter(
        (i) => i.severity === "error"
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe("key_takeaway validation", () => {
    it("accepts skipped takeaway with reason", () => {
      const content = emptyArticleContent();
      const takeaway = content.sequence.find(
        (b): b is Extract<typeof b, { type: "key_takeaway" }> =>
          b.type === "key_takeaway"
      );
      if (takeaway) {
        takeaway.skipped = true;
        takeaway.skipReason = "Article is a short-form piece";
      }
      const warnings = validateArticleContent(content).filter(
        (i) => i.code === "takeaway_skip_reason"
      );
      expect(warnings).toHaveLength(0);
    });

    it("warns when skipped takeaway lacks reason", () => {
      const content = emptyArticleContent();
      const takeaway = content.sequence.find(
        (b): b is Extract<typeof b, { type: "key_takeaway" }> =>
          b.type === "key_takeaway"
      );
      if (takeaway) {
        takeaway.skipped = true;
        takeaway.skipReason = undefined;
      }
      const warnings = validateArticleContent(content).filter(
        (i) => i.code === "takeaway_skip_reason"
      );
      expect(warnings).toHaveLength(1);
    });

    it("warns when takeaway has wrong number of items", () => {
      const content = emptyArticleContent();
      const takeaway = content.sequence.find(
        (b): b is Extract<typeof b, { type: "key_takeaway" }> =>
          b.type === "key_takeaway"
      );
      if (takeaway) {
        takeaway.items = ["Just one item"];
      }
      const warnings = validateArticleContent(content).filter(
        (i) => i.code === "takeaway_count"
      );
      expect(warnings).toHaveLength(1);
    });
  });

  describe("top-level validation", () => {
    it("rejects non-object input", () => {
      const issues = validateArticleContent("string");
      expect(issues.some((i) => i.code === "not_object")).toBe(true);
    });

    it("rejects missing version", () => {
      const issues = validateArticleContent({
        sequence: [],
        version: 2,
      });
      expect(issues.some((i) => i.code === "bad_version")).toBe(true);
    });

    it("rejects missing sequence", () => {
      const issues = validateArticleContent({ version: 1 });
      expect(issues.some((i) => i.code === "missing_sequence")).toBe(true);
    });

    it("rejects wrong sequence length", () => {
      const content = emptyArticleContent();
      content.sequence = content.sequence.slice(0, 3) as typeof content.sequence;
      const errors = validateArticleContent(content).filter(
        (i) => i.code === "scaffold_length"
      );
      expect(errors).toHaveLength(1);
    });
  });
});
