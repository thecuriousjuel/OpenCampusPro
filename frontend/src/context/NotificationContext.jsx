import { createContext, useContext, useState } from 'react';
import Toast from '../components/Toast';

const NotificationContext = createContext(null);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success', duration = 5000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const showSuccess = (message, duration) => showToast(message, 'success', duration);
    const showError = (message, duration) => showToast(message, 'error', duration);
    const showInfo = (message, duration) => showToast(message, 'info', duration);
    const showWarning = (message, duration) => showToast(message, 'warning', duration);

    return (
        <NotificationContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
