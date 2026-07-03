import { useState, useCallback } from 'react';

/**
 * Lightweight toast system.
 *
 *   const { toasts, push } = useToasts();
 *   push('success', 'Saved!');
 *   <Toaster toasts={toasts} />
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts(list => [...list, { id, type, message }]);
    setTimeout(() => {
      setToasts(list => list.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(list => list.filter(t => t.id !== id));
  }, []);

  return { toasts, push, dismiss };
}

const styles = {
  success: { bar: 'bg-green-500', icon: '✓', ring: 'border-green-100', text: 'text-green-700 dark:text-green-400' },
  error:   { bar: 'bg-red-500',   icon: '✕', ring: 'border-red-100',   text: 'text-red-700 dark:text-red-400'   },
  info:    { bar: 'bg-slate-700', icon: 'ℹ', ring: 'border-slate-100', text: 'text-slate-700' },
};

export function Toaster({ toasts = [], onDismiss }) {
  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(16px) scale(0.98); }
          to   { opacity: 1; transform: translateX(0)    scale(1);    }
        }
      `}</style>
      <div className="fixed top-4 right-4 z-[60] space-y-2 w-[320px] max-w-[calc(100vw-2rem)]">
        {toasts.map(t => {
          const s = styles[t.type] || styles.info;
          return (
            <div
              key={t.id}
              style={{ animation: 'toastIn 0.22s ease-out' }}
              className={`flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl shadow-lg border ${s.ring} pl-0 pr-3 py-3 overflow-hidden`}
            >
              <div className={`w-1.5 self-stretch ${s.bar}`} />
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs shrink-0 ${s.bar}`}>
                {s.icon}
              </div>
              <p className={`flex-1 text-sm font-medium ${s.text} leading-snug`}>{t.message}</p>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(t.id)}
                  className="text-gray-300 dark:text-gray-600 hover:text-gray-500 transition shrink-0"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default Toaster;