'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface PgpKeyInfo {
  fingerprint: string;
  userIds: string[];
  algorithm: string;
  created: string;
  keyId: string;
}

interface PgpKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  armoredKey: string;
}

function formatFingerprint(fp: string): string {
  return fp.replace(/(.{4})/g, '$1 ').trim();
}

function decodeArmoredKey(raw: string): string {
  // Handle literal \n from env vars (Cloudflare, .env quoting)
  const normalized = raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
  if (normalized.startsWith('-----BEGIN')) return normalized;
  try {
    return atob(normalized);
  } catch {
    return normalized;
  }
}

// How long an outcome stays in the status region before it goes back to empty.
const STATUS_WINDOW_MS = 2000;

// Single-entry memo: the modal renders one key at a time, so remembering the
// most recently parsed key is enough to make reopening it instant.
let cached: { key: string; info: PgpKeyInfo } | null = null;

export default function PgpKeyModal({ isOpen, onClose, armoredKey }: PgpKeyModalProps) {
  // Focus and the scroll lock belong to the open/closed transition, not to the
  // dialog's content: taken when the modal opens, given back when it closes,
  // whatever the dialog inside did in between.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // The dialog mounts per open, and a different key gets a fresh one. That is
  // what resets the parse, copy and status state between opens — the previous
  // version undid them in an effect when `isOpen` went false, which is the
  // set-state-in-effect pattern the React Compiler lint rules reject.
  return <PgpKeyDialog key={armoredKey} armoredKey={armoredKey} onClose={onClose} />;
}

interface PgpKeyDialogProps {
  armoredKey: string;
  onClose: () => void;
}

function PgpKeyDialog({ armoredKey, onClose }: PgpKeyDialogProps) {
  const { t } = useTranslation();
  const decodedKey = useMemo(() => decodeArmoredKey(armoredKey), [armoredKey]);
  // Reopening the same key is instant: the memo seeds the initial state, so
  // the dialog never announces a load it has nothing to load for.
  const [keyInfo, setKeyInfo] = useState<PgpKeyInfo | null>(() =>
    cached?.key === decodedKey ? cached.info : null
  );
  const [loading, setLoading] = useState(() => cached?.key !== decodedKey);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [justLoaded, setJustLoaded] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const focusableElementsRef = useRef<HTMLElement[]>([]);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (cached?.key === decodedKey) return;

    let cancelled = false;

    (async () => {
      try {
        const { readKey } = await import('openpgp');
        const key = await readKey({ armoredKey: decodedKey });
        if (cancelled) return;

        const algoInfo = key.getAlgorithmInfo();
        const info = {
          fingerprint: formatFingerprint(key.getFingerprint()),
          userIds: key.getUserIDs(),
          algorithm: `${algoInfo.algorithm}${algoInfo.bits ? ` (${algoInfo.bits}-bit)` : ''}`,
          created: key.getCreationTime().toISOString().split('T')[0],
          keyId: key.getKeyID().toHex(),
        };
        cached = { key: decodedKey, info };
        setKeyInfo(info);
        // A parse that finishes leaves no visible change a screen reader can
        // notice on its own — the details it fills in are above the fold of
        // the dialog's own scroll — so the status region says so.
        setJustLoaded(true);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [decodedKey]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    if (dialogRef.current) {
      focusableElementsRef.current = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
    }
  }, [loading, error, keyInfo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = focusableElementsRef.current;
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // The "loaded" line is an announcement, not a permanent label: it clears on
  // the same 2s window the copy outcome uses, leaving the region empty again.
  useEffect(() => {
    if (!justLoaded) return;
    const timer = setTimeout(() => setJustLoaded(false), STATUS_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [justLoaded]);

  // The reset timer outlives a click, so it has to be cancellable: closing the
  // dialog mid-window would otherwise leave it running.
  useEffect(
    () => () => {
      if (copyResetRef.current !== null) {
        clearTimeout(copyResetRef.current);
      }
    },
    []
  );

  const handleCopy = useCallback(async () => {
    if (copyResetRef.current !== null) {
      clearTimeout(copyResetRef.current);
    }

    try {
      // navigator.clipboard is absent outside secure contexts, and writeText
      // rejects when the document lacks permission or focus. Either way the key
      // is still selectable in the <pre> above, so say so rather than throwing.
      if (navigator.clipboard === undefined) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(decodedKey);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }

    copyResetRef.current = setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, STATUS_WINDOW_MS);
  }, [decodedKey]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const statusMessage = copyFailed
    ? t('pgp.copyFailed')
    : copied
      ? t('pgp.copied')
      : loading
        ? t('pgp.loading')
        : justLoaded
          ? t('pgp.loaded')
          : '';
  const statusTone = copyFailed ? 'text-red-400' : copied ? 'text-primary' : 'text-text-muted';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pgp-modal-title"
        tabIndex={-1}
        className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl outline-none"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="pgp-modal-title" className="text-lg font-semibold text-text-primary">
            {t('pgp.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted transition-colors hover:text-text-primary"
            aria-label={t('pgp.close')}
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Failure is the one thing that interrupts: the rest of the dialog's
            lifecycle goes through the single status region below. */}
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-400">
            {t('pgp.error')}
          </p>
        )}

        {keyInfo && (
          <div className="mb-4 space-y-2 text-sm">
            <div>
              <span className="font-medium text-text-muted">{t('pgp.fingerprint')}: </span>
              <code className="break-all font-mono text-xs text-primary">
                {keyInfo.fingerprint}
              </code>
            </div>
            {keyInfo.userIds.map((uid) => (
              <div key={uid}>
                <span className="font-medium text-text-muted">{t('pgp.userId')}: </span>
                <span className="text-text-primary">{uid}</span>
              </div>
            ))}
            <div>
              <span className="font-medium text-text-muted">{t('pgp.algorithm')}: </span>
              <span className="text-text-primary">{keyInfo.algorithm}</span>
            </div>
            <div>
              <span className="font-medium text-text-muted">{t('pgp.created')}: </span>
              <span className="text-text-primary">{keyInfo.created}</span>
            </div>
            <div>
              <span className="font-medium text-text-muted">{t('pgp.keyId')}: </span>
              <code className="font-mono text-xs text-text-primary">{keyInfo.keyId}</code>
            </div>
            <p className="mt-3 text-xs text-text-muted italic">{t('pgp.verifyNotice')}</p>
          </div>
        )}

        {/* A scroll container holding nothing focusable is unreachable from the
            keyboard on WebKit, so the key block is a labelled region in the tab
            order (Close -> key -> Copy; the focus trap picks it up via its
            tabindex). */}
        <div
          role="region"
          aria-label={t('pgp.keyRegion')}
          tabIndex={0}
          className="mb-4 max-h-96 overflow-auto rounded border border-slate-700 bg-slate-950 p-5 [&]:scrollbar-thin"
        >
          <pre className="whitespace-pre font-mono text-[11px] leading-relaxed text-text-secondary">
            {decodedKey}
          </pre>
        </div>

        <div className="flex items-center gap-3">
          {/* The label stays put: swapping it would rename the control mid-use
              and, being the accessible name, would be announced as a new button
              rather than as the outcome of pressing this one. */}
          <button
            onClick={handleCopy}
            className="rounded bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {t('pgp.copyKey')}
          </button>

          {/* The dialog's one status region: it carries the key parse (loading
              -> loaded -> empty) and then every copy outcome. Outside the button
              so the announcement never becomes part of its accessible name, and
              mounted even when empty — a live region that appears together with
              its first message is not announced. */}
          <p role="status" aria-live="polite" className={`text-sm ${statusTone}`}>
            {statusMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
