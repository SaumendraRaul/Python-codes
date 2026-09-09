import { get, put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PATH = 'slate/current.txt';
const MAX_BYTES = 4 * 1024 * 1024;

function storageErrorResponse() {
  return Response.json(
    {
      error: 'Storage is not connected yet.',
      code: 'STORAGE_NOT_CONNECTED',
    },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function GET() {
  try {
    const blob = await get(PATH, { access: 'private' });

    if (!blob) {
      return Response.json(
        { text: '', exists: false },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const text = await new Response(blob.stream).text();

    return Response.json(
      { text, exists: true },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Slate load failed:', error);
    return storageErrorResponse();
  }
}

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const bytes = new TextEncoder().encode(text).byteLength;

    if (bytes > MAX_BYTES) {
      return Response.json(
        {
          error: 'This note is too large. Slate currently allows up to 4 MB per saved document.',
          code: 'TOO_LARGE',
        },
        { status: 413 },
      );
    }

    await put(PATH, text, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'text/plain; charset=utf-8',
      cacheControlMaxAge: 60,
    });

    return Response.json(
      {
        ok: true,
        bytes,
        savedAt: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('Slate save failed:', error);
    return storageErrorResponse();
  }
}
