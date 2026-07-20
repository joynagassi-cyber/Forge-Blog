/**
 * Canonical block model (section 10.1).
 * Editor serializes to this shape; public blog renders from it.
 */

export type BodyBlockType =
  | "paragraph"
  | "h2"
  | "h3"
  | "callout"
  | "quote"
  | "table"
  | "code"
  | "toggle"
  | "checklist"
  | "image"
  | "bookmark"
  | "equation"
  | "mermaid"
  | "footnotes"
  | "embed"
  | "divider"
  | "diagram"
  | "product_bridge_inline";

export type CalloutVariant = "info" | "warning" | "verify" | "tip";

export interface InlineMark {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: string;
}

export interface RichTextSpan {
  text: string;
  marks?: InlineMark;
}

export interface BaseBlock {
  id: string;
  type: BodyBlockType;
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  spans: RichTextSpan[];
}

export interface HeadingBlock extends BaseBlock {
  type: "h2" | "h3";
  text: string;
  anchor?: string;
}

export interface CalloutBlock extends BaseBlock {
  type: "callout";
  variant: CalloutVariant;
  title?: string;
  spans: RichTextSpan[];
}

export interface QuoteBlock extends BaseBlock {
  type: "quote";
  spans: RichTextSpan[];
  attribution?: string;
}

export interface TableBlock extends BaseBlock {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  language: string;
  code: string;
}

export interface ToggleBlock extends BaseBlock {
  type: "toggle";
  summary: string;
  children: BodyBlock[];
}

export interface ChecklistBlock extends BaseBlock {
  type: "checklist";
  ordered?: boolean;
  items: { text: string; checked?: boolean }[];
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
}

export interface BookmarkBlock extends BaseBlock {
  type: "bookmark";
  url: string;
  title?: string;
  description?: string;
}

export interface EquationBlock extends BaseBlock {
  type: "equation";
  latex: string;
}

export interface MermaidBlock extends BaseBlock {
  type: "mermaid";
  definition: string;
  title?: string;
}

export interface FootnotesBlock extends BaseBlock {
  type: "footnotes";
  items: { id: string; text: string; href?: string }[];
}

export interface EmbedBlock extends BaseBlock {
  type: "embed";
  embedType: "youtube" | "twitter" | "iframe" | "generic";
  url: string;
  title?: string;
  width?: number;
  height?: number;
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
}

export interface DiagramNode {
  id: string;
  label: string;
  type: "step" | "decision" | "artifact";
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface DiagramBlock extends BaseBlock {
  type: "diagram";
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ProductBridgeBlock extends BaseBlock {
  type: "product_bridge_inline";
  product: "nainoforge" | "scyforge";
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

export type BodyBlock =
  | ParagraphBlock
  | HeadingBlock
  | CalloutBlock
  | QuoteBlock
  | TableBlock
  | CodeBlock
  | ToggleBlock
  | ChecklistBlock
  | ImageBlock
  | BookmarkBlock
  | EquationBlock
  | MermaidBlock
  | FootnotesBlock
  | EmbedBlock
  | DividerBlock
  | DiagramBlock
  | ProductBridgeBlock;

export interface HeroMeta {
  type: "hero_meta";
  title: string;
  dek: string;
  author: string;
  authorBio?: string;
  publishedAt: string;
  updatedAt?: string;
  readTimeMinutes: number;
  pillarSlug: string;
  pillarName: string;
  coverImageUrl?: string;
  coverImageAlt?: string;
}

export interface KeyTakeaway {
  type: "key_takeaway";
  items: string[];
  skipped?: boolean;
  skipReason?: string;
}

export interface TocAnchor {
  type: "toc_anchor";
}

export interface ConversionBlock {
  type: "conversion_block";
  product: "nainoforge" | "scyforge" | "none";
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface RelatedArticlesAnchor {
  type: "related_articles_anchor";
}

export type ScaffoldBlock =
  | HeroMeta
  | KeyTakeaway
  | TocAnchor
  | { type: "body_blocks"; blocks: BodyBlock[] }
  | ConversionBlock
  | RelatedArticlesAnchor;

/** Full article content stored in articles.content jsonb */
export interface ArticleContent {
  sequence: ScaffoldBlock[];
  version: 1;
}

export function emptyArticleContent(): ArticleContent {
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
      { type: "body_blocks", blocks: [] },
      {
        type: "conversion_block",
        product: "none",
        headline: "",
        body: "",
        ctaLabel: "",
        ctaHref: "",
      },
      { type: "related_articles_anchor" },
    ],
  };
}
