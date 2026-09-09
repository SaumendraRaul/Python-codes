'use client';

import { useEffect, useMemo, useState } from 'react';

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function encodeText(text: string) {
  const bytes = new TextEncoder().encode(text);

  if (typeof CompressionStream !== 'undefined') {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    return `g.${bytesToBase64Url(compressed)}`;
  }

  return `r.${bytesToBase64Url(bytes)}`;
}

async function decodeText(value: string) {
  const [mode, payload] = value.split('.', 2);
  if (!payload) throw new Error('Invalid slate link');

  const bytes = base64UrlToBytes(payload);

  if (mode === 'g') {
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser cannot open compressed Slate links.');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const restored = new Uint8Array(await new Response(stream).arrayBuffer());
    return new TextDecoder().decode(restored);
  }

  if (mode === 'r') return new TextDecoder().decode(bytes);
  throw new Error('Unknown slate format');
}

export default function Home() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('Ready');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#s=')) return;

    setBusy(true);
    decodeText(hash.slice(3))
      .then((value) => {
        setText(value);
        setStatus('Opened from link');
      })
      .catch(() => setStatus('Could not open this link'))
      .finally(() => setBusy(false));
  }, []);

  const details = useMemo(() => {
    const lines = text ? text.split('\n').length : 0;
    return `${text.length.toLocaleString()} chars · ${lines.toLocaleString()} lines`;
  }, [text]);

  async function makeLink(copy = true) {
    if (!text.trim()) {
      setStatus('Nothing to save');
      return;
    }

    try {
      setBusy(true);
      setStatus('Preparing link…');
      const encoded = await encodeText(text);
      const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;
      window.history.replaceState(null, '', `#s=${encoded}`);

      if (copy) {
        await navigator.clipboard.writeText(url);
        setStatus('Link copied');
      } else {
        setStatus('Link updated');
      }
    } catch {
      setStatus('Could not copy link');
    } finally {
      setBusy(false);
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Text copied');
    } catch {
      setStatus('Could not copy text');
    }
  }

  function clearSlate() {
    setText('');
    window.history.replaceState(null, '', window.location.pathname);
    setStatus('Cleared');
  }

  return (
    <main className="shell">
      <section className="panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">SLATE</p>
            <h1>Untitled</h1>
          </div>
          <div className="status" aria-live="polite">{busy ? 'Working…' : status}</div>
        </header>

        <textarea
          className="editor"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setStatus('Unsaved');
          }}
          placeholder="Start typing…"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Slate editor"
        />

        <footer className="toolbar">
          <span className="details">{details}</span>
          <div className="actions">
            <button className="ghost" type="button" onClick={clearSlate} disabled={busy || !text}>
              Clear
            </button>
            <button className="ghost" type="button" onClick={copyText} disabled={busy || !text}>
              Copy text
            </button>
            <button className="primary" type="button" onClick={() => makeLink(true)} disabled={busy || !text}>
              Copy link
            </button>
          </div>
        </footer>
      </section>

      <p className="hint">The note travels inside the link. Keep the link if you want to open it later.</p>
    </main>
  );
}
