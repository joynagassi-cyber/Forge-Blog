import type {
  ArticleContent,
  BodyBlock,
  BodyBlockType,
  RichTextSpan,
} from "./types";

// ---------------------------------------------------------------------------
// BlockNote block shapes (headless/Tiptap schema, minimal sub-set we handle).
// We don't import @blocknote/core types here to keep this module isomorphic.
// ---------------------------------------------------------------------------

type BNBlock = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  children?: BNBlock[];
};

type BNParagraph = BNBlock & {
  type: "paragraph";
  props: { text?: string };
};

type BNHeading = BNBlock & {
  type: "heading";
  props: {
    text?: string;
    level: 1 | 2 | 3;
  };
};

type BNCallout = BNBlock & {
  type: "callout";
  props: {
    text?: string;
    type?: string;
  };
};

type BNQuote = BNBlock & {
  type: "quote";
  props: { text?: string };
};

type BNCode = BNBlock & {
  type: "codeBlock";
  props: {
    code?: string;
    language?: string;
  };
};

type BNTable = BNBlock & {
  type: "table";
  children: BNBlock[][];
};

type BNToggle = BNBlock & {
  type: "toggle";
  props: { text?: string };
  children: BNBlock[];
};

type BNChecklist = BNBlock & {
  type: "checkbox";
  props: { text?: string; checked?: boolean };
};

type BNImage = BNBlock & {
  type: "image";
  props: { url?: string; alt?: string };
};

type BNDivider = BNBlock & {
  type: "divider";
};

type BNBookmark = BNBlock & {
  type: "bookmark";
  props: { url?: string; title?: string; description?: string };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function spansFromText(text?: string): RichTextSpan[] {
  if (!text) return [];
  return [{ text }];
}

function extractLevel(level: 1 | 2 | 3): BodyBlockType {
  return level === 1 ? "h2" : "h2";
}

function mapType(bn: BNBlock): BodyBlockType | null {
  switch (bn.type) {
    case "paragraph":
      return "paragraph";
    case "heading":
      return bn.props?.level === 1 ? "h2" : bn.props?.level === 3 ? "h3" : "h2";
    case "callout":
      return "callout";
    case "quote":
      return "quote";
    case "codeBlock":
      return "code";
    case "table":
      return "table";
    case "toggle":
      return "toggle";
    case "checkbox":
      return "checklist";
    case "image":
      return "image";
    case "divider":
      return "divider";
    case "bookmark":
      return "bookmark";
    case "math":
      return "equation";
    case "mermaid":
      return "mermaid";
    default:
      return null;
  }
}

function calloutVariant(
  raw?: string
): "info" | "warning" | "verify" | "tip" {
  const m = (raw ?? "").toLowerCase();
  if (m.includes("warn") || m.includes("danger")) return "warning";
  if (m.includes("verify") || m.includes("check")) return "verify";
  if (m.includes("tip") || m.includes("success")) return "tip";
  return "info";
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Single BlockNote → BodyBlock conversion
// ---------------------------------------------------------------------------

function bnToBodyBlock(bn: BNBlock): BodyBlock | null {
  const mapped = mapType(bn);
  if (!mapped) return null;

  const base = { id: bn.id || uid() };

  switch (mapped) {
    case "paragraph": {
      const p = bn as BNParagraph;
      return { ...base, type: "paragraph", spans: spansFromText(p.props?.text) };
    }
    case "h2": {
      const h = bn as BNHeading;
      return { ...base, type: "h2", text: String(h.props?.text ?? "") };
    }
    case "h3": {
      const h = bn as BNHeading;
      return { ...base, type: "h3", text: String(h.props?.text ?? "") };
    }
    case "callout": {
      const c = bn as BNCallout;
      return {
        ...base,
        type: "callout",
        variant: calloutVariant(c.props?.type as string | undefined),
        title: "",
        spans: spansFromText(c.props?.text),
      };
    }
    case "quote": {
      const q = bn as BNQuote;
      return { ...base, type: "quote", spans: spansFromText(q.props?.text) };
    }
    case "code": {
      const c = bn as BNCode;
      return {
        ...base,
        type: "code",
        language: c.props?.language ?? "text",
        code: String(c.props?.code ?? ""),
      };
    }
    case "table": {
      const t = bn as BNTable;
      const headers: string[] = [];
      const rows: string[][] = [];
      for (const row of t.children ?? []) {
        const cells: string[] = [];
        for (const cell of row.children ?? []) {
          const p = cell as BNParagraph;
          cells.push(String(p.props?.text ?? ""));
        }
        if (headers.length === 0 && rows.length === 0) {
          headers.push(...cells);
        } else {
          rows.push(cells);
        }
      }
      return { ...base, type: "table", headers, rows };
    }
    case "toggle": {
      const t = bn as BNToggle;
      const children = (t.children ?? [])
        .map(bnToBodyBlock)
        .filter((b): b is BodyBlock => b !== null);
      return { ...base, type: "toggle", summary: String(t.props?.text ?? ""), children };
    }
    case "checklist": {
      const c = bn as BNChecklist;
      return {
        ...base,
        type: "checklist",
        ordered: false,
        items: [{ text: String(c.props?.text ?? ""), checked: Boolean(c.props?.checked) }],
      };
    }
    case "image": {
      const img = bn as BNImage;
      return {
        ...base,
        type: "image",
        src: String(img.props?.url ?? ""),
        alt: String(img.props?.alt ?? ""),
      };
    }
    case "divider":
      return { ...base, type: "divider" };
    case "bookmark": {
      const bm = bn as BNBookmark;
      return {
        ...base,
        type: "bookmark",
        url: String(bm.props?.url ?? ""),
        title: String(bm.props?.title ?? ""),
        description: String(bm.props?.description ?? ""),
      };
    }
    case "equation": {
      const eq = bn as BNBlock & { props: { latex?: string } };
      return {
        ...base,
        type: "equation",
        latex: String(eq.props?.latex ?? ""),
      };
    }
    case "mermaid": {
      const md = bn as BNBlock & { props: { definition?: string; title?: string } };
      return {
        ...base,
        type: "mermaid",
        definition: String(md.props?.definition ?? ""),
        title: String(md.props?.title ?? ""),
      };
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a raw BlockNote document (array of blocks) into
 * the canonical §10 scaffold ArticleContent, leaving
 * hero_meta / key_takeaway / conversion_block empty so the
 * form in the admin editor fills them explicitly.
 */
export function fromBlockNote(blocks: unknown[]): ArticleContent {
  const bodyBlocks = (blocks as BNBlock[])
    .map(bnToBodyBlock)
    .filter((b): b is BodyBlock => b !== null);

  return {
    version: 1,
    sequence: [
      {
        type: "hero_meta",
        title: "",
        dek: "",
        author: "",
        publishedAt: new Date().toISOString(),
        readTimeMinutes: 1,
        pillarSlug: "",
        pillarName: "",
      },
      { type: "key_takeaway", items: [] },
      { type: "toc_anchor" },
      { type: "body_blocks", blocks: bodyBlocks },
      {
        type: "conversion_block",
        product: "none",
        headline: "",
        body: "",
        ctaLabel: "",
        ctaHref: "#",
      },
      { type: "related_articles_anchor" },
    ],
  };
}

/**
 * Convert canonial body blocks back to a shape the BlockNote editor can
 * accept. Currently used to rehydrate blocks into the editor for live edits.
 *
 * BlockNote cannot consume our BodyBlock[] directly — this function
 * performs the inverse mapping for the types we support. Unsupported
 * types degrade to paragraph text placeholders.
 */
export function toBlockNote(blocks: BodyBlock[]): unknown[] {
  return blocks.map((block) => {
    switch (block.type) {
      case "paragraph":
        return {
          id: block.id,
          type: "paragraph",
          props: { text: block.spans.map((s) => s.text).join("") },
        };
      case "h2":
        return { id: block.id, type: "heading", props: { text: block.text, level: 2 } };
      case "h3":
        return { id: block.id, type: "heading", props: { text: block.text, level: 3 } };
      case "callout":
        return {
          id: block.id,
          type: "callout",
          props: { text: block.spans.map((s) => s.text).join(""), type: block.variant },
        };
      case "quote":
        return { id: block.id, type: "quote", props: { text: block.spans.map((s) => s.text).join("") } };
      case "code":
        return { id: block.id, type: "codeBlock", props: { code: block.code, language: block.language } };
      case "table":
        return {
          id: block.id,
          type: "table",
          children: [
            block.headers.map((h) => ({ type: "paragraph", id: uid(), props: { text: h }, children: [] })),
            ...block.rows.map(
              (row) =>
                row.map((cell) => ({ type: "paragraph", id: uid(), props: { text: cell }, children: [] }))
            ),
          ],
        };
      case "toggle":
        return {
          id: block.id,
          type: "toggle",
          props: { text: block.summary },
          children: toBlockNote(block.children) as BNBlock[],
        };
      case "checklist":
        return {
          id: block.id,
          type: "checkbox",
          props: {
            text: block.items[0]?.text ?? "",
            checked: Boolean(block.items[0]?.checked),
          },
        };
      case "image":
        return { id: block.id, type: "image", props: { url: block.src, alt: block.alt } };
      case "divider":
        return { id: block.id, type: "divider" };
      case "bookmark":
        return {
          id: block.id,
          type: "bookmark",
          props: { url: block.url, title: block.title, description: block.description },
        };
      case "equation":
        return {
          id: block.id,
          type: "math",
          props: { latex: block.latex },
        };
      case "mermaid":
        return {
          id: block.id,
          type: "mermaid",
          props: {
            definition: block.definition,
            title: block.title ?? "",
          },
        };
      default:
        // Unsupported: degrade to plain paragraph so it stays readable
        return { id: block.id, type: "paragraph" as const, props: { text: "Unsupported block" }, children: [] };
    }
  });
}
