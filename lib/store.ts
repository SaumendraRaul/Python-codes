import { get, put } from "@vercel/blob";
import type { Snippet } from "./types";

const DATA_PATH = "code-vault/snippets.json";

export async function readSnippets(): Promise<Snippet[]> {
  try {
    const result = await get(DATA_PATH, {
      access: "private",
      useCache: false,
    });

    if (!result) return [];
    const text = await new Response(result.stream).text();
    if (!text.trim()) return [];

    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/404|not found/i.test(message)) return [];
    throw error;
  }
}

export async function writeSnippets(snippets: Snippet[]) {
  await put(DATA_PATH, JSON.stringify(snippets, null, 2), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  });
}
