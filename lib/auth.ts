import { timingSafeEqual } from "node:crypto";

export function authorize(request: Request) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    return { ok: false as const, status: 503, message: "APP_PASSWORD is not configured in Vercel." };
  }

  const provided = request.headers.get("x-app-password") ?? "";
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return { ok: false as const, status: 401, message: "Incorrect password." };
  }

  if (!timingSafeEqual(expectedBuffer, providedBuffer)) {
    return { ok: false as const, status: 401, message: "Incorrect password." };
  }

  return { ok: true as const };
}
