import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Batches = () => {
    const { API_URL, token } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [batches, setBatches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, batchId: null });
    const [formData, setFormData] = useState({
        name: '',
        course_id: '',
        teacher_id: '',
        start_date: '',
        end_date: '',
        capacity: 30
    });
    const location = useLocation();

    useEffect(() => {
        fetchBatches();
        fetchCourses();
        fetchTeachers();

        if (location.state?.openAddModal) {
            setEditMode(false);
            setFormData({ name: '', course_id: '', teacher_id: '', start_date: '', end_date: '', capacity: 30 });
            setShowModal(true);
            // Clear state to prevent reopening on refresh
            window.history.replaceState({}, document.title);
        }
    }, []);

    const fetchBatches = async () => {
        try {
            const response = await fetch(`${API_URL}/batches?per_page=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setBatches(data.batches || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await fetch(`${API_URL}/courses?per_page=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await fetch(`${API_URL}/teachers?per_page=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setTeachers(data.teachers || []);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editMode ? `${API_URL}/batches/${selectedBatch.id}` : `${API_URL}/batches`;
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
                showSuccess(`Batch ${editMode ? 'updated' : 'created'} successfully!`);
                fetchBatches();
                handleCloseModal();
            } else {
                const errorData = await response.json();
                showError(`Failed to ${editMode ? 'update' : 'create'} batch: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            showError(`Failed to ${editMode ? 'update' : 'create'} batch. Please check your connection.`);
        }
    };

    const handleEdit = (batch) => {
        setSelectedBatch(batch);
        setFormData({
            name: batch.name,
            course_id: batch.course_id,
            teacher_id: batch.teacher_id || '',
            start_date: batch.start_date || '',
            end_date: batch.end_date || '',
            capacity: batch.capacity
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async () => {
        const id = confirmDialog.batchId;
        setConfirmDialog({ isOpen: false, batchId: null });

        try {
            const response = await fetch(`${API_URL}/batches/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showSuccess('Batch deleted successfully!');
                fetchBatches();
            } else {
                const errorData = await response.json();
                showError(`Failed to delete batch: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to delete batch. Please check your connection.');
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmDialog({ isOpen: true, batchId: id });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedBatch(null);
        setFormData({ name: '', course_id: '', teacher_id: '', start_date: '', end_date: '', capacity: 30 });
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
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="page-title">Batches</h1>
                    <p className="text-muted">Manage student batches</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Batch</button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Batch Name</th>
                                <th>Course</th>
                                <th>Teacher</th>
                                <th>Capacity</th>
                                <th>Start Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.length === 0 ? (
                                <tr><td colSpan="6" className="text-center text-muted">No batches found</td></tr>
                            ) : (
                                batches.map((batch) => (
                                    <tr key={batch.id}>
                                        <td><strong>{batch.name}</strong></td>
                                        <td>{batch.course_name || '-'}</td>
                                        <td>{batch.teacher_name || '-'}</td>
                                        <td>{batch.capacity}</td>
                                        <td>{batch.start_date ? new Date(batch.start_date).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(batch)}>✏️</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(batch.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={handleCloseModal} title={editMode ? 'Edit Batch' : 'Add New Batch'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Batch Name *</label>
                        <input type="text" className="form-input" value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Course *</label>
                        <select className="form-select" value={formData.course_id}
                            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })} required>
                            <option value="">Select Course</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Teacher</label>
                        <select className="form-select" value={formData.teacher_id}
                            onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}>
                            <option value="">Select Teacher</option>
                            {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Capacity</label>
                        <input type="number" className="form-input" value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Start Date</label>
                        <input type="date" className="form-input" value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">End Date</label>
                        <input type="date" className="form-input" value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editMode ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Batch"
                message="Are you sure you want to delete this batch? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, batchId: null })}
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

export default Batches;
