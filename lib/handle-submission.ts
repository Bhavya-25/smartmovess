import { NextResponse } from "next/server";
import { z, type ZodType } from "zod";
import { rateLimit } from "./rate-limit";
import { sendFormNotification } from "./mailer";

type Json = { ok: boolean; message?: string; errors?: Record<string, string[]> };

function json(body: Json, status = 200) {
  return NextResponse.json(body, { status });
}

function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/**
 * Shared handler for every public form endpoint:
 * rate limit → parse JSON → zod validate → honeypot → email the entry to the team.
 */
export async function handleSubmission<T extends { hp?: string }>(
  req: Request,
  schema: ZodType<T>,
  formName: string,
) {
  const path = new URL(req.url).pathname;
  if (!rateLimit(`${path}:${clientIp(req)}`)) {
    return json({ ok: false, message: "Too many requests. Please wait a minute and try again." }, 429);
  }

  if (Number(req.headers.get("content-length") ?? 0) > 20_000) {
    return json({ ok: false, message: "Request is too large." }, 413);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, message: "Invalid request." }, 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errors = z.flattenError(parsed.error).fieldErrors as Record<string, string[]>;
    return json({ ok: false, message: "Please correct the highlighted fields.", errors }, 422);
  }

  const { hp, ...data } = parsed.data;
  if (hp) return json({ ok: true }); // bot: pretend success, store nothing

  const sent = await sendFormNotification(formName, data as Record<string, unknown>);
  if (!sent) {
    console.error(`[${path}] submission could not be emailed`);
    return json({ ok: false, message: "Something went wrong on our side. Please try again in a moment." }, 500);
  }
  return json({ ok: true }, 201);
}
