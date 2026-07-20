/**
 * GET /robots.txt
 * Returns robots.txt with sitemap URL and crawl rules.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";

export async function GET(): Promise<Response> {
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
