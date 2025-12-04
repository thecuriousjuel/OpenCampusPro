import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Teachers = () => {
    const { API_URL, token } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [search, setSearch] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, teacherId: null });
    const location = useLocation();

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        specialization: ''
    });

    useEffect(() => {
        fetchTeachers();

        if (location.state?.openAddModal) {
            setEditMode(false);
            setFormData({ name: '', email: '', phone: '', specialization: '' });
            setShowModal(true);
            // Clear state to prevent reopening on refresh
            window.history.replaceState({}, document.title);
        }
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await fetch(`${API_URL}/teachers?per_page=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setTeachers(data.teachers || []);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editMode ? `${API_URL}/teachers/${selectedTeacher.id}` : `${API_URL}/teachers`;
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
                showSuccess(`Teacher ${editMode ? 'updated' : 'created'} successfully!`);
                fetchTeachers();
                handleCloseModal();
            } else {
                const errorData = await response.json();
                showError(`Failed to ${editMode ? 'update' : 'create'} teacher: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving teacher:', error);
            showError(`Failed to ${editMode ? 'update' : 'create'} teacher. Please check your connection.`);
        }
    };

    const handleEdit = (teacher) => {
        setSelectedTeacher(teacher);
        setFormData({
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone || '',
            specialization: teacher.specialization || ''
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async () => {
        const id = confirmDialog.teacherId;
        setConfirmDialog({ isOpen: false, teacherId: null });

        try {
            const response = await fetch(`${API_URL}/teachers/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showSuccess('Teacher deleted successfully!');
                fetchTeachers();
            } else {
                const errorData = await response.json();
                showError(`Failed to delete teacher: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting teacher:', error);
            showError('Failed to delete teacher. Please check your connection.');
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmDialog({ isOpen: true, teacherId: id });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedTeacher(null);
        setFormData({ name: '', email: '', phone: '', specialization: '' });
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTeachers = teachers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(teachers.length / itemsPerPage);

    if (loading) {
        return <div className="page-container"><div className="spinner"></div></div>;
    }

    return (
        <div className="page-container fade-in">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="page-title">Teachers</h1>
                    <p className="text-muted">Manage teacher records</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Add Teacher
                </button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Specialization</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTeachers.length === 0 ? (
                                <tr><td colSpan="5" className="text-center text-muted">No teachers found</td></tr>
                            ) : (
                                currentTeachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td>{teacher.name}</td>
                                        <td>{teacher.email}</td>
                                        <td>{teacher.phone || '-'}</td>
                                        <td>{teacher.specialization || '-'}</td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(teacher)}>✏️</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(teacher.id)}>🗑️</button>
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
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, teachers.length)} of {teachers.length} teachers
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

            <Modal isOpen={showModal} onClose={handleCloseModal} title={editMode ? 'Edit Teacher' : 'Add New Teacher'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name *</label>
                        <input type="text" className="form-input" value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input type="email" className="form-input" value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input type="text" className="form-input" value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Specialization</label>
                        <input type="text" className="form-input" value={formData.specialization}
                            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editMode ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Teacher"
                message="Are you sure you want to delete this teacher? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, teacherId: null })}
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

export default Teachers;
