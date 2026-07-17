import { describe, it, expect } from "vitest";
import { fromBlockNote, toBlockNote } from "@/lib/blocks/from-blocknote";
import type { BodyBlock, ArticleContent } from "@/lib/blocks/types";

describe("fromBlockNote / toBlockNote bridge", () => {
  it("round-trips supported body blocks through BlockNote shape", () => {
    const blocks: BodyBlock[] = [
      { id: "b1", type: "paragraph", spans: [{ text: "Hello" }] },
      { id: "b2", type: "h2", text: "Heading" },
      { id: "b3", type: "h3", text: "Sub" },
      { id: "b4", type: "callout", variant: "info", title: "Note", spans: [{ text: "text" }] },
      { id: "b5", type: "quote", spans: [{ text: "quote" }] },
      { id: "b6", type: "code", language: "python", code: "x=1" },
      { id: "b7", type: "table", headers: ["A", "B"], rows: [["1", "2"]] },
      { id: "b8", type: "toggle", summary: "more", children: [
        { id: "b8c", type: "paragraph", spans: [{ text: "hidden" }] },
      ]},
      { id: "b9", type: "checklist", ordered: false, items: [{ text: "task" }] },
      { id: "b10", type: "image", src: "/img.png", alt: "img" },
      { id: "b11", type: "divider" },
      { id: "b12", type: "bookmark", url: "https://x.com", title: "X", description: "link" },
    ];

    const bn = toBlockNote(blocks) as unknown[];
    expect(bn).toHaveLength(12);

    const roundTripped = fromBlockNote(bn);
    expect(roundTripped).toMatchObject<Partial<ArticleContent>>({
      version: 1,
      sequence: expect.arrayContaining([
        expect.objectContaining({ type: "hero_meta" }),
        expect.objectContaining({ type: "key_takeaway" }),
        expect.objectContaining({ type: "toc_anchor" }),
        expect.objectContaining({ type: "body_blocks" }),
        expect.objectContaining({ type: "conversion_block" }),
        expect.objectContaining({ type: "related_articles_anchor" }),
      ]),
    });

    const body = roundTripped.sequence.find((b) => b.type === "body_blocks");
    expect(body?.type).toBe("body_blocks");
    const types = (body as { blocks: BodyBlock[] } | undefined)?.blocks.map((b) => b.type) ?? [];
    expect(types).toEqual([
      "paragraph",
      "h2",
      "h3",
      "callout",
      "quote",
      "code",
      "table",
      "toggle",
      "checklist",
      "image",
      "divider",
      "bookmark",
    ]);
  });

  it("produces empty body_blocks from empty input", () => {
    const out = fromBlockNote([]);
    const body = out.sequence.find((b) => b.type === "body_blocks");
    expect(body?.type).toBe("body_blocks");
    expect((body as { blocks: BodyBlock[] } | undefined)?.blocks).toHaveLength(0);
  });

  it("preserves non-body scaffold fields on save", () => {
    const existing: ArticleContent = {
      version: 1,
      sequence: [
        { type: "hero_meta", title: "keep me", dek: "", author: "", publishedAt: "", readTimeMinutes: 1, pillarSlug: "x", pillarName: "X" },
        { type: "key_takeaway", items: ["keep"] },
        { type: "toc_anchor" },
        { type: "body_blocks", blocks: [{ id: "x", type: "paragraph", spans: [{ text: "hi" }] }] },
        { type: "conversion_block", product: "nainoforge", headline: "old", body: "", ctaLabel: "", ctaHref: "" },
        { type: "related_articles_anchor" },
      ],
    };

    const out = fromBlockNote([{ id: "y", type: "paragraph", props: { text: "new body" } } as never]);
    const merged = out.sequence.map((block, i) => ({
      ...block,
      ...(i < existing.sequence.length && existing.sequence[i].type === block.type
        ? existing.sequence[i]
        : {}),
    }));

    const hero = merged.find((b) => b.type === "hero_meta") as { title?: string };
    expect(hero.title).toBe("keep me");
    const conv = merged.find((b) => b.type === "conversion_block") as { headline?: string; product?: string };
    expect(conv.headline).toBe("old");
    expect(conv.product).toBe("nainoforge");
  });
});
