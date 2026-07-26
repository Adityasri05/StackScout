import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastType = 'success' | 'info' | 'error';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Render Node */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => {
            let icon = <CheckCircle2 className="text-success w-5 h-5 flex-shrink-0" />;
            let borderColor = 'border-success/30';
            let bgClass = 'bg-surface';
            
            if (t.type === 'error') {
              icon = <AlertCircle className="text-danger w-5 h-5 flex-shrink-0" />;
              borderColor = 'border-danger/30';
            } else if (t.type === 'info') {
              icon = <Info className="text-accent w-5 h-5 flex-shrink-0" />;
              borderColor = 'border-accent/30';
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`pointer-events-auto flex items-start gap-3 p-4 bg-raised/95 border ${borderColor} rounded-xl shadow-2xl backdrop-blur-md`}
              >
                {icon}
                <div className="flex-1 text-[13px] font-medium text-text mt-0.5 leading-tight">
                  {t.message}
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-muted hover:text-text hover:bg-white/5 p-1 rounded-lg transition"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
