"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: 'from-green-600 to-green-700 border-green-500',
    error: 'from-red-600 to-red-700 border-red-500',
    warning: 'from-yellow-600 to-yellow-700 border-yellow-500',
    info: 'from-blue-600 to-blue-700 border-blue-500',
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[99999] 
        bg-gradient-to-r ${colors[type]} border-2 rounded-xl p-4 shadow-2xl 
        max-w-md mx-4 backdrop-blur-sm`}
      onClick={onClose}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[type]}</span>
        <div className="flex-1">
          <p className="text-white font-medium text-sm leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>;
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {toasts.map((toast, index) => (
            <div key={toast.id} style={{ marginTop: index * 80 }}>
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => removeToast(toast.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

