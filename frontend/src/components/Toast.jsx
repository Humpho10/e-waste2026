import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

const icons = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    'ℹ️',
};

const colors = {
  success: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-400',
  error:   'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/50 text-yellow-800',
  info:    'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`
              flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg
              min-w-[280px] max-w-sm pointer-events-auto
              animate-slide-in backdrop-blur-sm
              ${colors[t.type]}
            `}
          >
            <span className="text-lg shrink-0 mt-0.5">{icons[t.type]}</span>
            <p className="text-sm font-medium leading-snug flex-1">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0 mt-0.5 transition"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);