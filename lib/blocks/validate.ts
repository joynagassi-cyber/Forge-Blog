import type {
  ArticleContent,
  BodyBlock,
  ScaffoldBlock,
} from "./types";

export type ValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  path?: string;
};

const REQUIRED_SEQUENCE = [
  "hero_meta",
  "key_takeaway",
  "toc_anchor",
  "body_blocks",
  "conversion_block",
  "related_articles_anchor",
] as const;

const BODY_TYPES = new Set([
  "paragraph",
  "h2",
  "h3",
  "callout",
  "quote",
  "table",
  "code",
  "toggle",
  "checklist",
  "image",
  "bookmark",
  "equation",
  "divider",
  "diagram",
  "product_bridge_inline",
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function validateArticleContent(input: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!isRecord(input)) {
    return [{ severity: "error", code: "not_object", message: "Content must be an object" }];
  }

  if (input.version !== 1) {
    issues.push({
      severity: "error",
      code: "bad_version",
      message: "content.version must be 1",
      path: "version",
    });
  }

  if (!Array.isArray(input.sequence)) {
    issues.push({
      severity: "error",
      code: "missing_sequence",
      message: "content.sequence must be an array",
      path: "sequence",
    });
    return issues;
  }

  const sequence = input.sequence as ScaffoldBlock[];
  const types = sequence.map((b) => (isRecord(b) ? String(b.type) : ""));

  for (let i = 0; i < REQUIRED_SEQUENCE.length; i++) {
    if (types[i] !== REQUIRED_SEQUENCE[i]) {
      issues.push({
        severity: "error",
        code: "scaffold_order",
        message: `Expected sequence[${i}] to be "${REQUIRED_SEQUENCE[i]}", got "${types[i] ?? "missing"}"`,
        path: `sequence[${i}]`,
      });
    }
  }

  if (sequence.length !== REQUIRED_SEQUENCE.length) {
    issues.push({
      severity: "error",
      code: "scaffold_length",
      message: `Sequence must have exactly ${REQUIRED_SEQUENCE.length} scaffold blocks`,
      path: "sequence",
    });
  }

  const bodyEntry = sequence.find((b) => isRecord(b) && b.type === "body_blocks");
  if (bodyEntry && isRecord(bodyEntry) && Array.isArray(bodyEntry.blocks)) {
    const blocks = bodyEntry.blocks as BodyBlock[];
    let productBridgeCount = 0;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (!isRecord(block) || !BODY_TYPES.has(String(block.type))) {
        issues.push({
          severity: "error",
          code: "unknown_body_type",
          message: `Unknown body block type at body_blocks[${i}]`,
          path: `sequence.body_blocks.blocks[${i}]`,
        });
        continue;
      }

      if (!block.id || typeof block.id !== "string") {
        issues.push({
          severity: "error",
          code: "missing_id",
          message: `Body block at index ${i} is missing id`,
          path: `sequence.body_blocks.blocks[${i}].id`,
        });
      }

      if (block.type === "product_bridge_inline") {
        productBridgeCount += 1;
      }

      if (block.type === "diagram") {
        const nodes = (block as { nodes?: unknown }).nodes;
        const edges = (block as { edges?: unknown }).edges;
        if (!Array.isArray(nodes) || !Array.isArray(edges)) {
          issues.push({
            severity: "error",
            code: "diagram_shape",
            message: "diagram blocks require nodes[] and edges[]",
            path: `sequence.body_blocks.blocks[${i}]`,
          });
        }
      }

      if (block.type === "image") {
        const img = block as { alt?: string; src?: string };
        if (!img.alt) {
          issues.push({
            severity: "warning",
            code: "image_alt",
            message: "Image block is missing alt text",
            path: `sequence.body_blocks.blocks[${i}].alt`,
          });
        }
        if (!img.src) {
          issues.push({
            severity: "error",
            code: "image_src",
            message: "Image block is missing src",
            path: `sequence.body_blocks.blocks[${i}].src`,
          });
        }
      }

      if (block.type === "code") {
        const code = block as { language?: string; code?: string };
        if (!code.language) {
          issues.push({
            severity: "warning",
            code: "code_language",
            message: "Code block should declare a language tag",
            path: `sequence.body_blocks.blocks[${i}].language`,
          });
        }
      }
    }

    if (productBridgeCount > 1) {
      issues.push({
        severity: "error",
        code: "too_many_bridges",
        message: "At most one product_bridge_inline is allowed in body_blocks",
        path: "sequence.body_blocks",
      });
    }
  }

  const takeaway = sequence.find((b) => isRecord(b) && b.type === "key_takeaway");
  if (takeaway && isRecord(takeaway)) {
    const items = takeaway.items;
    const skipped = takeaway.skipped === true;
    if (!skipped && Array.isArray(items) && (items.length < 2 || items.length > 4)) {
      issues.push({
        severity: "warning",
        code: "takeaway_count",
        message: "key_takeaway should have 2 to 4 bullet points (or be explicitly skipped)",
        path: "sequence.key_takeaway.items",
      });
    }
    if (skipped && !takeaway.skipReason) {
      issues.push({
        severity: "warning",
        code: "takeaway_skip_reason",
        message: "Skipped key_takeaway must include skipReason",
        path: "sequence.key_takeaway.skipReason",
      });
    }
  }

  return issues;
}

export function isValidArticleContent(input: unknown): input is ArticleContent {
  return validateArticleContent(input).every((i) => i.severity !== "error");
}

/** Extract H2/H3 headings for TOC generation */
export function extractToc(
  content: ArticleContent
): { id: string; text: string; level: 2 | 3 }[] {
  const body = content.sequence.find((b) => b.type === "body_blocks");
  if (!body || body.type !== "body_blocks") return [];

  return body.blocks
    .filter((b): b is Extract<BodyBlock, { type: "h2" | "h3" }> =>
      b.type === "h2" || b.type === "h3"
    )
    .map((b) => ({
      id: b.anchor || b.id,
      text: b.text,
      level: b.type === "h2" ? (2 as const) : (3 as const),
    }));
}
