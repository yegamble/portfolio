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
  if (raw.startsWith('-----BEGIN')) return raw;
  try {
    return atob(raw);
  } catch {
    return raw;
  }
}

export default function PgpKeyModal({ isOpen, onClose, armoredKey }: PgpKeyModalProps) {
  const { t } = useTranslation();
  const [keyInfo, setKeyInfo] = useState<PgpKeyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const decodedKey = useMemo(() => decodeArmoredKey(armoredKey), [armoredKey]);

  useEffect(() => {
    if (!isOpen) {
      setKeyInfo(null);
      setError(false);
      setCopied(false);
      previousFocusRef.current?.focus();
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement;

    let cancelled = false;
    setLoading(true);
    setError(false);

    (async () => {
      try {
        const { readKey } = await import('openpgp');
        const key = await readKey({ armoredKey: decodedKey });
        if (cancelled) return;

        const algoInfo = key.getAlgorithmInfo();
        setKeyInfo({
          fingerprint: formatFingerprint(key.getFingerprint()),
          userIds: key.getUserIDs(),
          algorithm: `${algoInfo.algorithm}${algoInfo.bits ? ` (${algoInfo.bits}-bit)` : ''}`,
          created: key.getCreationTime().toISOString().split('T')[0],
          keyId: key.getKeyID().toHex(),
        });
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, decodedKey]);

  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
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
  }, [isOpen, onClose]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(decodedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [decodedKey]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

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

        {loading && (
          <p className="mb-4 text-sm text-text-muted">{t('pgp.loading')}</p>
        )}

        {error && (
          <p className="mb-4 text-sm text-red-400">{t('pgp.error')}</p>
        )}

        {keyInfo && (
          <div className="mb-4 space-y-2 text-sm">
            <div>
              <span className="font-medium text-text-muted">{t('pgp.fingerprint')}: </span>
              <code className="break-all font-mono text-xs text-primary">{keyInfo.fingerprint}</code>
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

        <div className="mb-4 max-h-40 overflow-auto rounded border border-slate-700 bg-slate-950 p-3">
          <pre className="whitespace-pre-wrap break-all font-mono text-xs text-text-secondary">
            {decodedKey}
          </pre>
        </div>

        <button
          onClick={handleCopy}
          className="rounded bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          aria-label={t('pgp.copyKey')}
        >
          {copied ? t('pgp.copied') : t('pgp.copyKey')}
        </button>
      </div>
    </div>
  );
}
