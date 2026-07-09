import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiCheckCircle, FiHelpCircle } from 'react-icons/fi';

const ConfirmContext = createContext();

const TONES = {
  danger: {
    icon: FiAlertTriangle,
    iconWrap: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
    btn: 'bg-red-600 hover:bg-red-700',
  },
  success: {
    icon: FiCheckCircle,
    iconWrap: 'bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400',
    btn: 'bg-green-600 hover:bg-green-700',
  },
  default: {
    icon: FiHelpCircle,
    iconWrap: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    btn: 'bg-blue-600 hover:bg-blue-700',
  },
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  // Usage: const confirm = useConfirm(); if (!(await confirm('Delete this?', { tone: 'danger' }))) return;
  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setState({
        message,
        title: options.title ?? 'Are you sure?',
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        tone: options.tone ?? 'default',
        resolve,
      });
    });
  }, []);

  const close = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const tone = TONES[state?.tone] || TONES.default;
  const Icon = tone.icon;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => close(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${tone.iconWrap}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1.5">{state.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{state.message}</p>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="flex-1 border-2 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 py-2.5 rounded-xl text-sm font-medium transition"
                >
                  {state.cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  className={`flex-1 text-white py-2.5 rounded-xl text-sm font-semibold transition ${tone.btn}`}
                >
                  {state.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
