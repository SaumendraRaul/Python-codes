import { NextResponse } from "next/server";
import { authorize } from "@/lib/auth";
import { readSnippets, writeSnippets } from "@/lib/store";
import type { Snippet, SnippetInput } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authError(request: Request) {
  const auth = authorize(request);
  if (auth.ok) return null;
  return NextResponse.json({ error: auth.message }, { status: auth.status });
}

function normalizeInput(body: Partial<SnippetInput>): SnippetInput {
  const title = String(body.title ?? "").trim().slice(0, 120);
  const language = String(body.language ?? "text").trim().slice(0, 40) || "text";
  const code = String(body.code ?? "");
  const notes = String(body.notes ?? "").trim().slice(0, 2000);
  const id = body.id ? String(body.id) : undefined;
  const tags = Array.isArray(body.tags)
    ? body.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 10)
    : [];

  if (!title) throw new Error("A title is required.");
  if (!code.trim()) throw new Error("Code cannot be empty.");
  if (code.length > 500_000) throw new Error("This snippet is too large (500 KB max)." );

  return { id, title, language, code, notes, tags };
}

export async function GET(request: Request) {
  const denied = authError(request);
  if (denied) return denied;

  try {
    const snippets = await readSnippets();
    snippets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return NextResponse.json({ snippets });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not read your snippets. Check the Vercel Blob connection." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = authError(request);
  if (denied) return denied;

  try {
    const input = normalizeInput(await request.json());
    const snippets = await readSnippets();
    const now = new Date().toISOString();

    let saved: Snippet;
    if (input.id) {
      const index = snippets.findIndex((snippet) => snippet.id === input.id);
      if (index === -1) {
        return NextResponse.json({ error: "Snippet not found." }, { status: 404 });
      }
      saved = {
        ...snippets[index],
        title: input.title,
        language: input.language,
        code: input.code,
        notes: input.notes,
        tags: input.tags,
        updatedAt: now,
      };
      snippets[index] = saved;
    } else {
      saved = {
        id: crypto.randomUUID(),
        title: input.title,
        language: input.language,
        code: input.code,
        notes: input.notes,
        tags: input.tags,
        createdAt: now,
        updatedAt: now,
      };
      snippets.unshift(saved);
    }

    await writeSnippets(snippets);
    return NextResponse.json({ snippet: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save snippet.";
    const isValidation = /required|empty|large/i.test(message);
    if (!isValidation) console.error(error);
    return NextResponse.json({ error: message }, { status: isValidation ? 400 : 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = authError(request);
  if (denied) return denied;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing snippet id." }, { status: 400 });

    const snippets = await readSnippets();
    const next = snippets.filter((snippet) => snippet.id !== id);
    if (next.length === snippets.length) {
      return NextResponse.json({ error: "Snippet not found." }, { status: 404 });
    }

    await writeSnippets(next);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not delete snippet." }, { status: 500 });
  }
}
