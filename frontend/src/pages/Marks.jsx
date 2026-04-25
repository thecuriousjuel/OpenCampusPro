import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import './Marks.css';

const Marks = () => {
    const { API_URL, token } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [marks, setMarks] = useState([]);
    const [batches, setBatches] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedMark, setSelectedMark] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, markId: null });
    const [selectedBatch, setSelectedBatch] = useState('');
    const [searchStudent, setSearchStudent] = useState('');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        student_id: '',
        batch_id: '',
        marks_obtained: ''
    });

    useEffect(() => {
        fetchBatches();
        fetchStudents();
        fetchMarks();
    }, []);

    useEffect(() => {
        fetchMarks();
    }, [selectedBatch, searchStudent]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBatch, searchStudent]);

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

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${API_URL}/students?per_page=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setStudents(data.students || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchMarks = async () => {
        try {
            let url = `${API_URL}/marks?per_page=1000`;
            if (selectedBatch) {
                url += `&batch_id=${selectedBatch}`;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            let filteredMarks = data.marks || [];

            // Client-side student search filter
            if (searchStudent) {
                filteredMarks = filteredMarks.filter(mark =>
                    mark.student_name.toLowerCase().includes(searchStudent.toLowerCase()) ||
                    String(mark.student_code || mark.student_id).toLowerCase().includes(searchStudent.toLowerCase())
                );
            }

            setMarks(filteredMarks);
        } catch (error) {
            console.error('Error fetching marks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editMode ? `${API_URL}/marks/${selectedMark.id}` : `${API_URL}/marks`;
            const method = editMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showSuccess(`Mark ${editMode ? 'updated' : 'added'} successfully!`);
                fetchMarks();
                handleCloseModal();
            } else {
                const errorData = await response.json();
                showError(`Failed to ${editMode ? 'update' : 'add'} mark: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving mark:', error);
            showError(`Failed to ${editMode ? 'update' : 'add'} mark. Please check your connection.`);
        }
    };

    const handleEdit = (mark) => {
        setSelectedMark(mark);
        setFormData({
            student_id: mark.student_id,
            batch_id: mark.batch_id,
            marks_obtained: mark.marks_obtained
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async () => {
        const id = confirmDialog.markId;
        setConfirmDialog({ isOpen: false, markId: null });

        try {
            const response = await fetch(`${API_URL}/marks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showSuccess('Mark deleted successfully!');
                fetchMarks();
            } else {
                const errorData = await response.json();
                showError(`Failed to delete mark: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting mark:', error);
            showError('Failed to delete mark. Please check your connection.');
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmDialog({ isOpen: true, markId: id });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedMark(null);
        setFormData({ student_id: '', batch_id: '', marks_obtained: '' });
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentMarks = marks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(marks.length / itemsPerPage);

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
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="page-title">Marks Management</h1>
                    <p className="text-muted">Track student performance across batches</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Mark</button>
            </div>

            {/* Filters */}
            <div className="card mb-lg">
                <div className="filters-container">
                    <div className="form-group">
                        <label className="form-label">Filter by Batch</label>
                        <select
                            className="form-select"
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                        >
                            <option value="">All Batches</option>
                            {batches.map(batch => (
                                <option key={batch.id} value={batch.id}>
                                    {batch.name} - {batch.course_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Search Student</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name or ID..."
                            value={searchStudent}
                            onChange={(e) => setSearchStudent(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                <th>Batch</th>
                                <th>Course</th>
                                <th>Marks</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentMarks.length === 0 ? (
                                <tr><td colSpan="6" className="text-center text-muted">No marks found</td></tr>
                            ) : (
                                currentMarks.map((mark) => (
                                    <tr key={mark.id}>
                                        <td>{mark.student_code || mark.student_id}</td>
                                        <td>{mark.student_name}</td>
                                        <td>{mark.batch_name}</td>
                                        <td>{mark.course_name}</td>
                                        <td>{mark.marks_obtained}</td>
                                        <td>
                                            <span className={`badge ${mark.status === 'PASSED' ? 'status-badge-passed' : 'status-badge-failed'}`}>
                                                {mark.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(mark)}>✏️</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(mark.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        borderTop: '1px solid var(--border-color)'
                    }}>
                        <div className="text-muted">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, marks.length)} of {marks.length} marks
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                            >
                                First
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                ← Previous
                            </button>
                            <span className="text-muted">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next →
                            </button>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={showModal} onClose={handleCloseModal} title={editMode ? 'Edit Mark' : 'Add New Mark'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Batch *</label>
                        <select
                            className="form-select"
                            value={formData.batch_id}
                            onChange={(e) => setFormData({ ...formData, batch_id: e.target.value, student_id: '' })}
                            required
                            disabled={editMode}
                        >
                            <option value="">Select Batch</option>
                            {batches.map(batch => (
                                <option key={batch.id} value={batch.id}>
                                    {batch.name} - {batch.course_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Student *</label>
                        <select
                            className="form-select"
                            value={formData.student_id}
                            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                            required
                            disabled={editMode || !formData.batch_id}
                        >
                            <option value="">Select Student</option>
                            {students
                                .filter(student => !formData.batch_id || student.batch_id === parseInt(formData.batch_id))
                                .map(student => (
                                    <option key={student.id} value={student.id}>{student.name}</option>
                                ))
                            }
                        </select>
                        {!formData.batch_id && <small className="text-muted">Please select a batch first</small>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Marks Obtained (0-100) *</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.marks_obtained}
                            min="0"
                            max="100"
                            step="0.01"
                            onChange={(e) => setFormData({ ...formData, marks_obtained: e.target.value })}
                            required
                        />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editMode ? 'Update' : 'Add'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Mark"
                message="Are you sure you want to delete this mark? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, markId: null })}
                confirmText="Delete"
                type="danger"
            />
        </div >
    );
};

export default Marks;
