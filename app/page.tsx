'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Status = 'Loading' | 'Saved' | 'Unsaved' | 'Saving' | 'Offline' | 'Ready';

export default function Home() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('Loading');
  const [message, setMessage] = useState('Opening…');
  const [busy, setBusy] = useState(true);
  const [lastSaved, setLastSaved] = useState('');
  const savedTextRef = useRef('');

  const stats = useMemo(() => {
    const lines = text.length === 0 ? 0 : text.split('\n').length;
    const chars = text.length;
    const bytes = new TextEncoder().encode(text).byteLength;
    const size = bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${lines.toLocaleString()} lines · ${chars.toLocaleString()} chars · ${size}`;
  }, [text]);

  const load = useCallback(async () => {
    try {
      setBusy(true);
      setStatus('Loading');
      setMessage('Loading…');

      const response = await fetch('/api/slate', {
        method: 'GET',
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data?.code === 'STORAGE_NOT_CONNECTED') {
          throw new Error('Cloud storage is not connected yet.');
        }
        throw new Error(data?.error || 'Could not load Slate.');
      }

      const value = typeof data.text === 'string' ? data.text : '';
      setText(value);
      savedTextRef.current = value;
      setStatus(data.exists ? 'Saved' : 'Ready');
      setMessage(data.exists ? 'Synced' : 'Ready');
    } catch (error) {
      setStatus('Offline');
      setMessage(error instanceof Error ? error.message : 'Could not load Slate.');
    } finally {
      setBusy(false);
    }
  }, []);

  const save = useCallback(async () => {
    try {
      setBusy(true);
      setStatus('Saving');
      setMessage('Saving…');

      const response = await fetch('/api/slate', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        body: text,
      });

      const data = await response.json();

      if (!response.ok) {
        if (data?.code === 'STORAGE_NOT_CONNECTED') {
          throw new Error('Cloud storage is not connected yet.');
        }
        throw new Error(data?.error || 'Could not save Slate.');
      }

      savedTextRef.current = text;
      setStatus('Saved');
      setMessage('Saved');
      setLastSaved(
        new Date(data.savedAt || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    } catch (error) {
      setStatus('Offline');
      setMessage(error instanceof Error ? error.message : 'Could not save Slate.');
    } finally {
      setBusy(false);
    }
  }, [text]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!busy) void save();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, save]);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Copied');
    } catch {
      setMessage('Could not copy');
    }
  }

  function clearEditor() {
    setText('');
    setStatus('Unsaved');
    setMessage('Unsaved');
  }

  const isDirty = text !== savedTextRef.current;

  return (
    <main className="shell">
      <section className="panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">SLATE</p>
            <h1>Untitled</h1>
          </div>
          <div className={`status status-${status.toLowerCase()}`} aria-live="polite" title={message}>
            <span className="status-dot" />
            <span>{message}</span>
          </div>
        </header>

        <textarea
          className="editor"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setStatus('Unsaved');
            setMessage('Unsaved');
          }}
          placeholder={busy && status === 'Loading' ? 'Loading…' : 'Start typing…'}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          aria-label="Slate editor"
        />

        <footer className="toolbar">
          <div className="meta">
            <span className="details">{stats}</span>
            {lastSaved ? <span className="saved-time">Saved {lastSaved}</span> : null}
          </div>

          <div className="actions">
            <button className="ghost" type="button" onClick={() => void load()} disabled={busy}>
              Reload
            </button>
            <button className="ghost" type="button" onClick={clearEditor} disabled={busy || !text}>
              Clear
            </button>
            <button className="ghost" type="button" onClick={() => void copyText()} disabled={busy || !text}>
              Copy
            </button>
            <button className="primary" type="button" onClick={() => void save()} disabled={busy || !isDirty}>
              {status === 'Saving' ? 'Saving…' : 'Save'}
            </button>
          </div>
        </footer>
      </section>

      <p className="hint">Same Slate on every device. Ctrl/Cmd + S saves.</p>
    </main>
  );
}
