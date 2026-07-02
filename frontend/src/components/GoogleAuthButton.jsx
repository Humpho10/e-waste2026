import { useEffect, useRef, useState } from 'react';
import { googleAuth } from '../api/auth';
import { Google } from './icons';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC   = 'https://accounts.google.com/gsi/client';

// Loads the Google Identity Services script exactly once.
let gsiPromise = null;
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google script'));
    document.head.appendChild(s);
  });
  return gsiPromise;
}

/**
 * "Continue with Google" button.
 *  - When VITE_GOOGLE_CLIENT_ID is set, renders the real Google button and
 *    exchanges the credential with the backend (POST /auth/google).
 *  - When it isn't set (or the backend route is missing), it degrades to a
 *    friendly disabled state instead of throwing.
 *
 * Props:
 *   label        – button text ("Sign up with Google" / "Continue with Google")
 *   onSuccess(data) – called with { user, token, role } after auth
 *   onError(msg)    – called with a human-readable error string
 *   onStart()       – called when the exchange begins (to show a spinner)
 */
export default function GoogleAuthButton({ label = 'Continue with Google', onSuccess, onError, onStart }) {
  const targetRef = useRef(null);
  const [ready, setReady]   = useState(false);
  const [width, setWidth]   = useState(360);
  const configured = Boolean(CLIENT_ID);

  // Track container width so the rendered Google button spans full width.
  useEffect(() => {
    if (!targetRef.current) return;
    const measure = () => setWidth(Math.round(targetRef.current?.offsetWidth || 360));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(targetRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;

    loadGsi()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              onStart?.();
              const res = await googleAuth(credential);
              onSuccess?.(res.data);
            } catch (err) {
              onError?.(
                err.response?.data?.message ||
                'Google sign-in failed. The server may not support it yet.'
              );
            }
          },
        });
        setReady(true);
      })
      .catch(() => onError?.('Could not reach Google. Check your connection.'));

    return () => { cancelled = true; };
  }, [configured, onSuccess, onError, onStart]);

  // Render / re-render the official button when ready or width changes.
  useEffect(() => {
    if (!ready || !targetRef.current || !window.google?.accounts?.id) return;
    targetRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(targetRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: label.toLowerCase().includes('sign up') ? 'signup_with' : 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'center',
      width: Math.min(Math.max(width, 200), 400),
    });
  }, [ready, width, label]);

  // Not configured → show a styled, non-throwing placeholder.
  if (!configured) {
    return (
      <button
        type="button"
        onClick={() =>
          onError?.('Google sign-in isn’t configured yet — add VITE_GOOGLE_CLIENT_ID to enable it.')
        }
        className="btn-lift w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"
        title="Set VITE_GOOGLE_CLIENT_ID in frontend/.env to enable"
      >
        <Google />
        {label}
      </button>
    );
  }

  return (
    <div className="w-full">
      {/* Google renders its own button into this node */}
      <div ref={targetRef} className="flex justify-center [&>div]:w-full" />
      {!ready && (
        <div className="w-full flex items-center justify-center gap-2.5 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-400">
          <Google /> Loading Google…
        </div>
      )}
    </div>
  );
}