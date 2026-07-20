/**
 * GET /robots.txt
 * Returns robots.txt with sitemap URL, crawl rules, and AI agent policy.
 *
 * Policy rationale (2026):
 * - Allow search bots (OAI-SearchBot, PerplexityBot, Perplexity-User, Googlebot,
 *   Google-Extended) so the blog appears in AI-generated answers.
 * - Block training bots (GPTBot) to prevent model training usage.
 * - Keep existing admin/api disallows for protection.
 *
 * See: docs/superpowers/plans/2026-07-20-seo-aeo-geo-optimization.md
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";

export async function GET(): Promise<Response> {
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Search bots — allow for citation in AI-generated answers
User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# Google AI — allow for Gemini grounding
User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Googlebot-News
Allow: /

User-agent: Google-Extended
Allow: /

# Training bots — block to prevent model training usage
User-agent: GPTBot
Disallow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
