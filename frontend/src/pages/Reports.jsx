import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatINR } from '../utils/currency';

const Reports = () => {
    const { API_URL, token } = useAuth();
    const [reportType, setReportType] = useState('dashboard');
    const [dashboardStats, setDashboardStats] = useState(null);
    const [attendanceReport, setAttendanceReport] = useState(null);
    const [feesReport, setFeesReport] = useState(null);
    const [studentsReport, setStudentsReport] = useState(null);
    const [marksReport, setMarksReport] = useState(null);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
        fetchBatches();
    }, [reportType]);

    const fetchBatches = async () => {
        try {
            const response = await fetch(`${API_URL}/batches?per_page=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setBatches(data.batches || []);
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    };

    const fetchMarksAnalytics = async (batchId = '') => {
        try {
            let url = `${API_URL}/marks/analytics`;
            if (batchId) {
                url += `?batch_id=${batchId}`;
            }
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setMarksReport(data);
        } catch (error) {
            console.error('Error fetching marks analytics:', error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            if (reportType === 'dashboard') {
                const response = await fetch(`${API_URL}/reports/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setDashboardStats(data);
            } else if (reportType === 'attendance') {
                const response = await fetch(`${API_URL}/reports/attendance`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setAttendanceReport(data);
            } else if (reportType === 'fees') {
                const response = await fetch(`${API_URL}/reports/fees`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setFeesReport(data);
            } else if (reportType === 'students') {
                const response = await fetch(`${API_URL}/reports/students`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setStudentsReport(data);
            } else if (reportType === 'marks') {
                await fetchMarksAnalytics();
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container fade-in">
            <h1 className="page-title">Reports & Analytics</h1>
            <p className="text-muted mb-lg">View comprehensive reports and statistics</p>

            <div className="card mb-lg">
                <div className="flex gap-md">
                    <button className={`btn ${reportType === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setReportType('dashboard')}>📊 Dashboard Stats</button>
                    <button className={`btn ${reportType === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setReportType('attendance')}>✓ Attendance Report</button>
                    <button className={`btn ${reportType === 'fees' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setReportType('fees')}>💰 Fees Report</button>
                    <button className={`btn ${reportType === 'students' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setReportType('students')}>👨‍🎓 Students Report</button>
                    <button className={`btn ${reportType === 'marks' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setReportType('marks')}>📝 Marks Analytics</button>
                </div>
            </div>

            {loading ? (
                <div className="text-center"><div className="spinner"></div></div>
            ) : (
                <>
                    {reportType === 'dashboard' && dashboardStats && (
                        <div className="dashboard-grid">
                            <div className="card">
                                <h3 className="text-primary">{dashboardStats.students?.total || 0}</h3>
                                <p className="text-muted">Total Students</p>
                                <p className="text-success text-sm">{dashboardStats.students?.active || 0} Active</p>
                            </div>
                            <div className="card">
                                <h3 className="text-secondary">{dashboardStats.teachers?.total || 0}</h3>
                                <p className="text-muted">Total Teachers</p>
                            </div>
                            <div className="card">
                                <h3 className="text-info">{dashboardStats.courses?.total || 0}</h3>
                                <p className="text-muted">Total Courses</p>
                            </div>
                            <div className="card">
                                <h3 className="text-warning">{dashboardStats.batches?.total || 0}</h3>
                                <p className="text-muted">Active Batches</p>
                            </div>
                            <div className="card">
                                <h3 className="text-success">{dashboardStats.attendance?.rate || 0}%</h3>
                                <p className="text-muted">Attendance Rate</p>
                            </div>
                            <div className="card">
                                <h3 className="text-danger">{formatINR(dashboardStats.fees?.outstanding || 0)}</h3>
                                <p className="text-muted">Outstanding</p>
                                <p className="text-success text-sm">{formatINR(dashboardStats.fees?.paid || 0)} Collected</p>
                            </div>
                        </div>
                    )}

                    {reportType === 'attendance' && attendanceReport && (
                        <div className="card">
                            <h2 className="card-header">Attendance Summary</h2>
                            <div className="dashboard-grid mb-lg">
                                <div className="card">
                                    <h3 className="text-success">{attendanceReport.summary?.present || 0}</h3>
                                    <p>Present</p>
                                </div>
                                <div className="card">
                                    <h3 className="text-danger">{attendanceReport.summary?.absent || 0}</h3>
                                    <p>Absent</p>
                                </div>
                                <div className="card">
                                    <h3 className="text-warning">{attendanceReport.summary?.late || 0}</h3>
                                    <p>Late</p>
                                </div>
                                <div className="card">
                                    <h3 className="text-primary">{attendanceReport.summary?.attendance_rate || 0}%</h3>
                                    <p>Attendance Rate</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {reportType === 'fees' && feesReport && (
                        <div className="card">
                            <h2 className="card-header">Fee Collection Report</h2>
                            <div className="dashboard-grid mb-lg">
                                <div className="card">
                                    <h3 className="text-primary">{formatINR(feesReport.summary?.total_amount || 0)}</h3>
                                    <p>Total Amount</p>
                                </div>
                                <div className="card">
                                    <h3 className="text-success">{formatINR(feesReport.summary?.paid_amount || 0)}</h3>
                                    <p>Paid ({feesReport.summary?.paid_count || 0})</p>
                                </div>
                                <div className="card">
                                    <h3 className="text-warning">{formatINR(feesReport.summary?.pending_amount || 0)}</h3>
                                    <p>Pending ({feesReport.summary?.pending_count || 0})</p>
                                </div>
                                <div className="card">
                                    <h3 className="text-danger">{formatINR(feesReport.summary?.overdue_amount || 0)}</h3>
                                    <p>Overdue ({feesReport.summary?.overdue_count || 0})</p>
                                </div>
                            </div>
                            <div className="card">
                                <h3 className="text-success">Collection Rate: {feesReport.summary?.collection_rate || 0}%</h3>
                            </div>
                        </div>
                    )}

                    {reportType === 'students' && studentsReport && (
                        <div className="card">
                            <h2 className="card-header">Student Statistics</h2>
                            <div className="dashboard-grid">
                                <div className="card">
                                    <h3 className="text-primary">{studentsReport.total || 0}</h3>
                                    <p>Total Students</p>
                                </div>
                                <div className="card">
                                    <h3 className="text-success">{studentsReport.active || 0}</h3>
                                    <p>Active</p>
                                </div>
                                <div className="card">
                                    <h3 className="text-warning">{studentsReport.inactive || 0}</h3>
                                    <p>Inactive</p>
                                </div>
                                <div className="card">
                                    <h3 className="text-info">{studentsReport.graduated || 0}</h3>
                                    <p>Graduated</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {reportType === 'marks' && marksReport && (
                        <div className="card">
                            <h2 className="card-header">Marks Analytics</h2>

                            {/* Batch Filter */}
                            <div className="mb-lg">
                                <label className="form-label">Filter by Batch (Optional)</label>
                                <select
                                    className="form-select"
                                    style={{ maxWidth: '400px' }}
                                    value={selectedBatch}
                                    onChange={(e) => {
                                        setSelectedBatch(e.target.value);
                                        fetchMarksAnalytics(e.target.value);
                                    }}
                                >
                                    <option value="">All Batches</option>
                                    {batches.map(batch => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.name} - {batch.course_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Analytics Cards */}
                            <div className="dashboard-grid">
                                <div className="card">
                                    <h3 className="text-primary">{marksReport.total_students || 0}</h3>
                                    <p>Total Students</p>
                                </div>
                                <div className="card">
                                    <h3 className="text-success">{marksReport.passed || 0}</h3>
                                    <p>Passed (≥40)</p>
                                    <p className="text-sm text-muted">
                                        {marksReport.total_students > 0
                                            ? Math.round((marksReport.passed / marksReport.total_students) * 100)
                                            : 0}% pass rate
                                    </p>
                                </div>
                                <div className="card">
                                    <h3 className="text-danger">{marksReport.failed || 0}</h3>
                                    <p>Failed (&lt;40)</p>
                                    <p className="text-sm text-muted">
                                        {marksReport.total_students > 0
                                            ? Math.round((marksReport.failed / marksReport.total_students) * 100)
                                            : 0}% fail rate
                                    </p>
                                </div>
                                <div className="card">
                                    <h3 className="text-info">{marksReport.median_marks || 0}</h3>
                                    <p>Median Marks</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Reports;
