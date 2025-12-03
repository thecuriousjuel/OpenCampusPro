import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <span className="theme-icon">
                {theme === 'light' ? '🌙' : '☀️'}
            </span>
            <span className="theme-label">
                {theme === 'light' ? 'Dark' : 'Light'}
            </span>
        </button>
    );
};

export default ThemeToggle;
