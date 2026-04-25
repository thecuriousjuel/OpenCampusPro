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
    const [viewingTeacher, setViewingTeacher] = useState(null);
    const [showBatchesModal, setShowBatchesModal] = useState(false);
    const [search, setSearch] = useState('');
    const [specializationFilter, setSpecializationFilter] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, teacherId: null });
    const location = useLocation();

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        employee_id: '',
        name: '',
        email: '',
        phone: '',
        specialization: ''
    });

    useEffect(() => {
        fetchTeachers();

        if (location.state?.openAddModal) {
            setEditMode(false);
            setFormData({ employee_id: '', name: '', email: '', phone: '', specialization: '' });
            setShowModal(true);
            // Clear state to prevent reopening on refresh
            window.history.replaceState({}, document.title);
        }
    }, []);

    useEffect(() => {
        fetchTeachers();
    }, [search, specializationFilter]);

    const fetchTeachers = async () => {
        try {
            let url = `${API_URL}/teachers?per_page=100`;
            if (search) url += `&search=${search}`;
            if (specializationFilter) url += `&specialization=${specializationFilter}`;

            const response = await fetch(url, {
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
                let errorMessage = 'Unknown error';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || 'Unknown error';
                } catch (e) {
                    errorMessage = 'An unexpected error occurred. Please try again later.';
                }
                showError(`Failed to ${editMode ? 'update' : 'create'} teacher: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error saving teacher:', error);
            showError(`Failed to ${editMode ? 'update' : 'create'} teacher. Please check your connection.`);
        }
    };

    const handleEdit = (teacher) => {
        setSelectedTeacher(teacher);
        setFormData({
            employee_id: teacher.employee_id || '',
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone || '',
            specialization: teacher.specialization || ''
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleViewBatches = (teacher) => {
        setViewingTeacher(teacher);
        setShowBatchesModal(true);
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
                let errorMessage = 'Unknown error';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || 'Unknown error';
                } catch (e) {
                    errorMessage = 'An unexpected error occurred. Please try again later.';
                }
                showError(`Failed to delete teacher: ${errorMessage}`);
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
        setFormData({ employee_id: '', name: '', email: '', phone: '', specialization: '' });
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTeachers = teachers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(teachers.length / itemsPerPage);

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
                    <h1 className="page-title">Teachers</h1>
                    <p className="text-muted">Manage teacher records</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    ➕ Add Teacher
                </button>
            </div>

            <div className="card mb-lg">
                <div className="flex gap-md">
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name, email or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ width: '200px', marginBottom: 0 }}>
                        <select
                            className="form-select"
                            value={specializationFilter}
                            onChange={(e) => setSpecializationFilter(e.target.value)}
                        >
                            <option value="">All Specializations</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Data Science">Data Science</option>
                            <option value="Web Development">Web Development</option>
                            <option value="Machine Learning">Machine Learning</option>
                            <option value="Software Engineering">Software Engineering</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Specialization</th>
                                <th>Assigned Batches</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTeachers.length === 0 ? (
                                <tr><td colSpan="5" className="text-center text-muted">No teachers found</td></tr>
                            ) : (
                                currentTeachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td>{teacher.employee_id || teacher.id}</td>
                                        <td>{teacher.name}</td>
                                        <td>{teacher.email}</td>
                                        <td>{teacher.phone || '-'}</td>
                                        <td>{teacher.specialization || '-'}</td>
                                        <td>
                                            {teacher.batches && teacher.batches.length > 0 ? (
                                                <button 
                                                    className="btn btn-secondary btn-sm" 
                                                    onClick={() => handleViewBatches(teacher)}
                                                >
                                                    {teacher.batches.length} Batch(es)
                                                </button>
                                            ) : (
                                                <span className="text-muted">None</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleViewBatches(teacher)} title="View Batches">📚</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(teacher)} title="Edit">✏️</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(teacher.id)} title="Delete">🗑️</button>
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
                        <label className="form-label">Employee ID</label>
                        <input type="text" className="form-input" value={formData.employee_id}
                            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                            placeholder="Auto-generated if empty" />
                    </div>
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

            <Modal isOpen={showBatchesModal} onClose={() => setShowBatchesModal(false)} title={`Batches Assigned to ${viewingTeacher?.name}`}>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Batch Name</th>
                                <th>Course</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!viewingTeacher?.batches || viewingTeacher.batches.length === 0 ? (
                                <tr><td colSpan="2" className="text-center text-muted">No batches currently assigned.</td></tr>
                            ) : (
                                viewingTeacher.batches.map((batch) => (
                                    <tr key={batch.id}>
                                        <td>{batch.name}</td>
                                        <td>{batch.course_name || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="modal-footer mt-md">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowBatchesModal(false)}>Close</button>
                </div>
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
