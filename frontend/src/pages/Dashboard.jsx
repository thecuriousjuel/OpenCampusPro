import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';
import './Dashboard.css';

const Dashboard = () => {
    const { API_URL, token } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/reports/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-container">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container fade-in">
            <h1 className="page-title">Dashboard</h1>
            <p className="text-muted mb-lg">Welcome to your management dashboard</p>

            <div className="dashboard-grid">
                <div className="stat-card card card-hover">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                        👨‍🎓
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-value">{stats?.students?.total || 0}</h3>
                        <p className="stat-label">Total Students</p>
                        <p className="stat-meta text-success">{stats?.students?.active || 0} active</p>
                    </div>
                </div>

                <div className="stat-card card card-hover">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
                        👨‍🏫
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-value">{stats?.teachers?.total || 0}</h3>
                        <p className="stat-label">Total Teachers</p>
                    </div>
                </div>

                <div className="stat-card card card-hover">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                        📚
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-value">{stats?.courses?.total || 0}</h3>
                        <p className="stat-label">Total Courses</p>
                    </div>
                </div>

                <div className="stat-card card card-hover">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                        🎓
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-value">{stats?.batches?.total || 0}</h3>
                        <p className="stat-label">Active Batches</p>
                    </div>
                </div>

                <div className="stat-card card card-hover">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                        ✓
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-value">{stats?.attendance?.rate || 0}%</h3>
                        <p className="stat-label">Attendance Rate</p>
                        <p className="stat-meta text-muted">This month</p>
                    </div>
                </div>

                <div className="stat-card card card-hover">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                        💰
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-value">{formatINR(stats?.fees?.outstanding || 0)}</h3>
                        <p className="stat-label">Outstanding Fees</p>
                        <p className="stat-meta text-success">{formatINR(stats?.fees?.paid || 0)} collected</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-sections">
                <div className="card">
                    <h2 className="card-header">Quick Actions</h2>
                    <div className="quick-actions">
                        <button className="btn btn-primary">➕ Add Student</button>
                        <button className="btn btn-primary">➕ Add Teacher</button>
                        <button className="btn btn-primary">➕ Create Batch</button>
                        <button className="btn btn-primary">✓ Mark Attendance</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
