"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Snippet } from "@/lib/types";

const LANGUAGES = [
  "python", "javascript", "typescript", "react", "tsx", "jsx", "html", "css",
  "json", "sql", "java", "c", "cpp", "bash", "text",
];

const emptyDraft = {
  id: "",
  title: "",
  language: "python",
  code: "",
  notes: "",
  tags: "",
};

type Draft = typeof emptyDraft;

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function Vault() {
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [query, setQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("code-vault-password");
    if (saved) {
      setPassword(saved);
      void unlock(saved, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function api(path: string, options: RequestInit = {}, suppliedPassword = password) {
    return fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-app-password": suppliedPassword,
        ...(options.headers ?? {}),
      },
      cache: "no-store",
    });
  }

  async function unlock(value = password, persist = remember) {
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      const response = await api("/api/snippets", {}, value);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not unlock Code Vault.");
      setSnippets(data.snippets ?? []);
      setUnlocked(true);
      if (persist) localStorage.setItem("code-vault-password", value);
      else localStorage.removeItem("code-vault-password");
    } catch (err) {
      localStorage.removeItem("code-vault-password");
      setUnlocked(false);
      setError(err instanceof Error ? err.message : "Could not unlock Code Vault.");
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setError("");
    try {
      const response = await api("/api/snippets");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not refresh snippets.");
      setSnippets(data.snippets ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh snippets.");
    }
  }

  async function saveSnippet(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await api("/api/snippets", {
        method: "POST",
        body: JSON.stringify({
          id: draft.id || undefined,
          title: draft.title,
          language: draft.language,
          code: draft.code,
          notes: draft.notes,
          tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save snippet.");
      await refresh();
      setDraft(emptyDraft);
      setShowEditor(false);
      setNotice(draft.id ? "Snippet updated." : "Snippet saved to the cloud.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save snippet.");
    } finally {
      setBusy(false);
    }
  }

  function editSnippet(snippet: Snippet) {
    setDraft({
      id: snippet.id,
      title: snippet.title,
      language: snippet.language,
      code: snippet.code,
      notes: snippet.notes,
      tags: snippet.tags.join(", "),
    });
    setShowEditor(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteSnippet(snippet: Snippet) {
    if (!window.confirm(`Delete “${snippet.title}”?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await api(`/api/snippets?id=${encodeURIComponent(snippet.id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete snippet.");
      setSnippets((current) => current.filter((item) => item.id !== snippet.id));
      setNotice("Snippet deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete snippet.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setNotice("Code copied.");
    window.setTimeout(() => setNotice(""), 1600);
  }

  function lock() {
    localStorage.removeItem("code-vault-password");
    setUnlocked(false);
    setPassword("");
    setSnippets([]);
    setDraft(emptyDraft);
  }

  const languages = useMemo(() => {
    return Array.from(new Set(snippets.map((snippet) => snippet.language))).sort();
  }, [snippets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return snippets.filter((snippet) => {
      if (languageFilter !== "all" && snippet.language !== languageFilter) return false;
      if (!q) return true;
      return [snippet.title, snippet.language, snippet.notes, snippet.tags.join(" "), snippet.code]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [snippets, query, languageFilter]);

  if (!unlocked) {
    return (
      <main className="shell authShell">
        <section className="authCard">
          <div className="logo">&lt;/&gt;</div>
          <p className="eyebrow">PRIVATE • CROSS-DEVICE</p>
          <h1>Code Vault</h1>
          <p className="muted">Your personal place for Python, React, JavaScript, notes, and anything else you want to carry between devices.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void unlock();
            }}
            className="authForm"
          >
            <label>
              Vault password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoFocus
              />
            </label>
            <label className="checkRow">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              Remember this device
            </label>
            {error && <div className="alert error">{error}</div>}
            <button className="primary" type="submit" disabled={busy || !password}>
              {busy ? "Unlocking…" : "Unlock vault"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">YOUR PRIVATE CLOUD</p>
          <h1>Code Vault</h1>
        </div>
        <div className="headerActions">
          <button className="ghost" onClick={() => void refresh()} disabled={busy}>Refresh</button>
          <button className="ghost" onClick={lock}>Lock</button>
          <button
            className="primary compact"
            onClick={() => {
              setDraft(emptyDraft);
              setShowEditor(true);
            }}
          >
            + New snippet
          </button>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}
      {notice && <div className="alert success">{notice}</div>}

      {showEditor && (
        <section className="panel editorPanel">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">{draft.id ? "EDIT" : "NEW"}</p>
              <h2>{draft.id ? "Update snippet" : "Save a snippet"}</h2>
            </div>
            <button
              className="iconButton"
              aria-label="Close editor"
              onClick={() => {
                setDraft(emptyDraft);
                setShowEditor(false);
              }}
            >
              ×
            </button>
          </div>
          <form onSubmit={saveSnippet} className="editorForm">
            <div className="formGrid">
              <label>
                Title
                <input
                  value={draft.title}
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  placeholder="e.g. FastAPI auth middleware"
                  required
                />
              </label>
              <label>
                Language
                <select value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value })}>
                  {LANGUAGES.map((language) => <option key={language}>{language}</option>)}
                </select>
              </label>
            </div>
            <label>
              Code
              <textarea
                className="codeEditor"
                value={draft.code}
                onChange={(event) => setDraft({ ...draft, code: event.target.value })}
                placeholder="Paste your code here…"
                spellCheck={false}
                required
              />
            </label>
            <div className="formGrid">
              <label>
                Tags
                <input
                  value={draft.tags}
                  onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
                  placeholder="api, work, utility"
                />
              </label>
              <label>
                Notes
                <input
                  value={draft.notes}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  placeholder="Optional context"
                />
              </label>
            </div>
            <div className="editorActions">
              <button type="button" className="ghost" onClick={() => setShowEditor(false)}>Cancel</button>
              <button type="submit" className="primary" disabled={busy}>
                {busy ? "Saving…" : draft.id ? "Save changes" : "Save to cloud"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="toolbar panel">
        <label className="searchBox">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, code, notes, tags…" />
        </label>
        <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value)}>
          <option value="all">All languages</option>
          {languages.map((language) => <option key={language}>{language}</option>)}
        </select>
        <span className="count">{filtered.length} snippet{filtered.length === 1 ? "" : "s"}</span>
      </section>

      <section className="snippetGrid">
        {filtered.map((snippet) => (
          <article className="snippetCard" key={snippet.id}>
            <div className="snippetTop">
              <div>
                <span className="languageBadge">{snippet.language}</span>
                <h3>{snippet.title}</h3>
              </div>
              <div className="cardActions">
                <button className="iconButton small" onClick={() => void copyCode(snippet.code)} title="Copy code">⧉</button>
                <button className="iconButton small" onClick={() => editSnippet(snippet)} title="Edit">✎</button>
                <button className="iconButton small danger" onClick={() => void deleteSnippet(snippet)} title="Delete">⌫</button>
              </div>
            </div>
            {snippet.notes && <p className="notes">{snippet.notes}</p>}
            <pre><code>{snippet.code}</code></pre>
            <div className="snippetFooter">
              <div className="tags">
                {snippet.tags.map((tag) => <span key={tag}>#{tag}</span>)}
              </div>
              <time>{formatDate(snippet.updatedAt)}</time>
            </div>
          </article>
        ))}
      </section>

      {!filtered.length && (
        <section className="empty panel">
          <div className="emptyIcon">⌘</div>
          <h2>{snippets.length ? "Nothing matched" : "Your vault is empty"}</h2>
          <p className="muted">{snippets.length ? "Try a different search or filter." : "Add your first Python, React, JS, SQL, or other snippet."}</p>
          {!snippets.length && <button className="primary" onClick={() => setShowEditor(true)}>Add first snippet</button>}
        </section>
      )}
    </main>
  );
}
