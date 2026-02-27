'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';


const ToastContext = createContext(null);


const Toast = ({ type, icon, title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      <i className={icon}></i>
      <div className="content">
        <div className="title">{title}</div>
        <span>{message}</span>
      </div>

      <style jsx>{`
        .toast {
          background: white;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 10px;
          box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 300px;
          max-width: 400px;
          animation: slideIn 0.3s ease-in forwards;
          border-left: 4px solid;
        }

        .toast.warning {
          border-left-color: #ffa500;
        }

        .toast.info {
          border-left-color: #2f86eb;
        }

        .toast i {
          font-size: 28px;
        }

        .toast.warning i {
          color: #ffa500;
        }

        .toast.info i {
          color: #2f86eb;
        }

        .toast .content {
          flex: 1;
        }

        .toast .title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .toast span {
          font-size: 14px;
          color: #656565;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes hide {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Main Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((type, message) => {
    const id = Date.now();
    const toastConfig = {
      warning: { icon: 'fa-solid fa-circle-exclamation', title: 'Warning' },
      info: { icon: 'fa-solid fa-circle-info', title: 'Info' }
    };

    const { icon, title } = toastConfig[type] || toastConfig.info;
    
    setToasts(prev => [...prev, { id, type, icon, title, message }]);
  }, []);

  const showToast = useCallback((type, message) => {
    addToast(type, message);
  }, [addToast]);

  // Specific functions for your use cases

const showLoginAlert = useCallback(() => {
    showToast('info', ' Log in succesfully');
  }, [showToast]);
  const showEmptySearchAlert = useCallback(() => {
    showToast('warning', 'Please enter a search term');
  }, [showToast]);

  const showNoMatchesAlert = useCallback((searchTerm) => {
    showToast('info', `No matches found for "${searchTerm}". Please try different keywords.`);
  }, [showToast]);

const showDeleteAlert = useCallback(() => {
    showToast('info', 'Delete action has been complited');
  }, [showToast]);

  const showUpdateAlert = useCallback(() => {
    showToast('info', 'Update action has been completed');
  }, [showToast]);

  const showSignUpAlert = useCallback(() => {
    showToast('info', 'Sign up successful');
  }, [showToast]);

  const showSuccessAlert =useCallback(()=>{
    showToast('info','Added to favorites!');
  },[showToast]);

  const showAlert = useCallback((type, message) => {
    showToast(type, message);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ 
      showToast, 
      showAlert,
      showEmptySearchAlert,
      showDeleteAlert ,
      showNoMatchesAlert,
      showLoginAlert,
      showUpdateAlert,
      showSuccessAlert,
      showSignUpAlert
    }}>
      {children}
      <div className="notifications">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            icon={toast.icon}
            title={toast.title}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <style jsx>{`
        .notifications {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: auto;
          max-width: 90vw;
          pointer-events: none;
        }
        
        .notifications > :global(div) {
          pointer-events: auto;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};