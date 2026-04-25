import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isLogoutHovered, setIsLogoutHovered] = useState(false);

    const menuItems = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/students', icon: '👨‍🎓', label: 'Students' },
        { path: '/teachers', icon: '👨‍🏫', label: 'Teachers' },
        { path: '/courses', icon: '📚', label: 'Courses' },
        { path: '/batches', icon: '🎓', label: 'Batches' },
        { path: '/marks', icon: '📝', label: 'Marks' },
        { path: '/attendance', icon: '✓', label: 'Attendance' },
        { path: '/fees', icon: '💰', label: 'Fees' },
        { path: '/reports', icon: '📈', label: 'Reports' },
    ];


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-logo">🎓 MyCampusPro</h2>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span className="sidebar-label">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="sidebar-footer">
                <ThemeToggle />
                <button
                    onClick={handleLogout}
                    className="logout-button"
                    onMouseEnter={() => setIsLogoutHovered(true)}
                    onMouseLeave={() => setIsLogoutHovered(false)}
                >
                    <span className="logout-icon">{isLogoutHovered ? '🚶‍♂️' : '🚪'}</span>
                    <span className="logout-label">Logout</span>
                </button>
                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Built with ❤️ by Biswajit
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
