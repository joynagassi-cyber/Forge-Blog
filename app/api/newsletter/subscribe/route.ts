/**
 * POST /api/newsletter/subscribe
 * Captures email for newsletter subscription.
 * In production, this would integrate with an email service (Mailchimp, etc.)
 */

import { NextRequest, NextResponse } from "next/server";

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  const locale = body.locale ?? "en";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!VALID_EMAIL.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  // TODO: Integrate with Mailchimp / SendGrid / Resend / Loops
  // For now, store in database or log
  console.log("[newsletter] Subscribe:", { email, locale, timestamp: new Date().toISOString() });

  return NextResponse.json({
    ok: true,
    message: "Subscribed successfully. You'll receive updates when new articles are published.",
  });
}
