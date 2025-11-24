import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Attendance = () => {
    const { API_URL, token } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [batches, setBatches] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBatches();
    }, []);

    useEffect(() => {
        if (selectedBatch && selectedDate) {
            fetchAttendance();
        }
    }, [selectedBatch, selectedDate]);

    const fetchBatches = async () => {
        try {
            const response = await fetch(`${API_URL}/batches?per_page=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setBatches(data.batches || []);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/attendance?batch_id=${selectedBatch}&date=${selectedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            // Convert to object for easier lookup
            const attendanceMap = {};
            (data.attendance || []).forEach(record => {
                attendanceMap[record.student_id] = record.status;
            });
            setAttendanceData(attendanceMap);

            // Fetch students for this batch
            const studentsResponse = await fetch(`${API_URL}/students?per_page=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const studentsData = await studentsResponse.json();
            setStudents(studentsData.students || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceChange = (studentId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (students.length === 0) {
            showError('No students found for this batch. Please add students first.');
            return;
        }

        const records = students.map(student => ({
            student_id: student.id,
            batch_id: parseInt(selectedBatch),
            date: selectedDate,
            status: attendanceData[student.id] || 'absent'
        }));

        try {
            const response = await fetch(`${API_URL}/attendance`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ records })
            });

            if (response.ok) {
                showSuccess(`Attendance saved successfully! Marked attendance for ${students.length} student(s) on ${selectedDate}.`);
                fetchAttendance();
            } else {
                showError('Failed to mark attendance. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to mark attendance. Please check your connection.');
        }
    };

    const markAll = (status) => {
        const newData = {};
        students.forEach(student => {
            newData[student.id] = status;
        });
        setAttendanceData(newData);
    };

    return (
        <div className="page-container fade-in">
            <h1 className="page-title">Attendance Management</h1>
            <p className="text-muted mb-lg">Mark and track student attendance</p>

            <div className="card mb-lg">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                    <div className="form-group">
                        <label className="form-label">Select Batch</label>
                        <select className="form-select" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                            <option value="">Choose a batch...</option>
                            {batches.map(batch => (
                                <option key={batch.id} value={batch.id}>{batch.name} - {batch.course_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Select Date</label>
                        <input type="date" className="form-input" value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)} />
                    </div>
                </div>
            </div>

            {selectedBatch && (
                <div className="card">
                    <div className="flex justify-between items-center mb-lg">
                        <h3>Mark Attendance</h3>
                        <div className="flex gap-sm">
                            <button className="btn btn-success btn-sm" onClick={() => markAll('present')}>✓ Mark All Present</button>
                            <button className="btn btn-danger btn-sm" onClick={() => markAll('absent')}>✗ Mark All Absent</button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center"><div className="spinner"></div></div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="table-container mb-lg">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Student Name</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map(student => (
                                            <tr key={student.id}>
                                                <td>{student.name}</td>
                                                <td>{student.email}</td>
                                                <td>
                                                    <div className="flex gap-sm">
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm ${attendanceData[student.id] === 'present' ? 'btn-success' : 'btn-secondary'}`}
                                                            onClick={() => handleAttendanceChange(student.id, 'present')}
                                                        >
                                                            ✓ Present
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm ${attendanceData[student.id] === 'absent' ? 'btn-danger' : 'btn-secondary'}`}
                                                            onClick={() => handleAttendanceChange(student.id, 'absent')}
                                                        >
                                                            ✗ Absent
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-sm ${attendanceData[student.id] === 'late' ? 'btn-warning' : 'btn-secondary'}`}
                                                            onClick={() => handleAttendanceChange(student.id, 'late')}
                                                        >
                                                            ⏰ Late
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg">💾 Save Attendance</button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default Attendance;
