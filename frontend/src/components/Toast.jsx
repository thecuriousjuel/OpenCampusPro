import { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`toast toast-${type} slide-in`}>
            <div className="toast-icon">
                {type === 'success' && '✅'}
                {type === 'error' && '❌'}
                {type === 'info' && 'ℹ️'}
                {type === 'warning' && '⚠️'}
            </div>
            <div className="toast-content">
                <p>{message}</p>
            </div>
            <button className="toast-close" onClick={onClose}>✕</button>
        </div>
    );
};

export default Toast;
