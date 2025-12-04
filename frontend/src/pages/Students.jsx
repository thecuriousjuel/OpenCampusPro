import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Students = () => {
    const { API_URL, token } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, studentId: null });

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        batch: '',
        status: '',
        enrollmentDateFrom: '',
        enrollmentDateTo: ''
    });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        status: 'active',
        batch_id: ''
    });

    useEffect(() => {
        fetchStudents();
        fetchBatches();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${API_URL}/students?per_page=1000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setStudents(data.students || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBatches = async () => {
        try {
            const response = await fetch(`${API_URL}/batches?per_page=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setBatches(data.batches || []);
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    };

    // Apply all filters
    const getFilteredStudents = () => {
        return students.filter(student => {
            // Search filter (name OR email)
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesName = student.name.toLowerCase().includes(searchLower);
                const matchesEmail = student.email.toLowerCase().includes(searchLower);
                if (!matchesName && !matchesEmail) return false;
            }

            // Batch filter
            if (filters.batch) {
                if (student.batch_id !== parseInt(filters.batch)) {
                    return false;
                }
            }

            // Status filter
            if (filters.status && student.status !== filters.status) {
                return false;
            }

            // Enrollment date from filter
            if (filters.enrollmentDateFrom && student.enrollment_date) {
                if (new Date(student.enrollment_date) < new Date(filters.enrollmentDateFrom)) {
                    return false;
                }
            }

            // Enrollment date to filter
            if (filters.enrollmentDateTo && student.enrollment_date) {
                if (new Date(student.enrollment_date) > new Date(filters.enrollmentDateTo)) {
                    return false;
                }
            }

            return true;
        });
    };

    // Get paginated students
    const getPaginatedStudents = () => {
        const filtered = getFilteredStudents();
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return filtered.slice(indexOfFirstItem, indexOfLastItem);
    };

    const filteredStudents = getFilteredStudents();
    const paginatedStudents = getPaginatedStudents();
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            batch: '',
            status: '',
            enrollmentDateFrom: '',
            enrollmentDateTo: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editMode ? `${API_URL}/students/${selectedStudent.id}` : `${API_URL}/students`;
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
                showSuccess(`Student ${editMode ? 'updated' : 'created'} successfully!`);
                fetchStudents();
                handleCloseModal();
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                showError(`Failed to ${editMode ? 'update' : 'create'} student: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving student:', error);
            showError(`Failed to ${editMode ? 'update' : 'create'} student. Please check your connection.`);
        }
    };

    const handleEdit = (student) => {
        setSelectedStudent(student);
        setFormData({
            name: student.name,
            email: student.email,
            phone: student.phone || '',
            address: student.address || '',
            status: student.status,
            batch_id: student.batch_id || ''
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async () => {
        const id = confirmDialog.studentId;
        setConfirmDialog({ isOpen: false, studentId: null });

        try {
            const response = await fetch(`${API_URL}/students/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showSuccess('Student deleted successfully!');
                fetchStudents();
            } else {
                const errorData = await response.json();
                console.error('Delete error:', errorData);
                showError(`Failed to delete student: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            showError(`Failed to delete student: ${error.message}`);
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmDialog({ isOpen: true, studentId: id });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedStudent(null);
        setFormData({ name: '', email: '', phone: '', address: '', status: 'active', batch_id: '' });
    };

    const handleAddNew = () => {
        setEditMode(false);
        setFormData({ name: '', email: '', phone: '', address: '', status: 'active', batch_id: '' });
        setShowModal(true);
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

    const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

    return (
        <div className="page-container fade-in">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="page-title">Students</h1>
                    <p className="text-muted">Manage student records ({filteredStudents.length} {filteredStudents.length === 1 ? 'student' : 'students'})</p>
                </div>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    ➕ Add Student
                </button>
            </div>

            {/* Filters Section */}
            <div className="card mb-lg">
                <div className="flex justify-between items-center mb-md">
                    <h3 style={{ margin: 0 }}>🔍 Filters {activeFiltersCount > 0 && `(${activeFiltersCount} active)`}</h3>
                    {activeFiltersCount > 0 && (
                        <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                            Clear All
                        </button>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {/* Search */}
                    <div>
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Name or email..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>

                    {/* Batch Filter */}
                    <div>
                        <label className="form-label">Batch</label>
                        <select
                            className="form-select"
                            value={filters.batch}
                            onChange={(e) => handleFilterChange('batch', e.target.value)}
                        >
                            <option value="">All Batches</option>
                            {batches.map(batch => (
                                <option key={batch.id} value={batch.id}>{batch.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="graduated">Graduated</option>
                        </select>
                    </div>

                    {/* Enrollment Date From */}
                    <div>
                        <label className="form-label">Enrolled From</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.enrollmentDateFrom}
                            onChange={(e) => handleFilterChange('enrollmentDateFrom', e.target.value)}
                        />
                    </div>

                    {/* Enrollment Date To */}
                    <div>
                        <label className="form-label">Enrolled To</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.enrollmentDateTo}
                            onChange={(e) => handleFilterChange('enrollmentDateTo', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Batch</th>
                                <th>Status</th>
                                <th>Enrollment Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted">
                                        {students.length === 0 ? 'No students found' : 'No students match the current filters'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedStudents.map((student) => (
                                    <tr key={student.id}>
                                        <td>{student.name}</td>
                                        <td>{student.email}</td>
                                        <td>{student.phone || '-'}</td>
                                        <td>
                                            {student.batch_id ? (
                                                <span className="badge badge-info">
                                                    {batches.find(b => b.id === student.batch_id)?.name || `Batch #${student.batch_id}`}
                                                </span>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${student.status === 'active' ? 'badge-success' :
                                                student.status === 'inactive' ? 'badge-warning' :
                                                    'badge-info'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td>{student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(student)}>
                                                    ✏️ Edit
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(student.id)}>
                                                    🗑️ Delete
                                                </button>
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
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
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

            <Modal isOpen={showModal} onClose={handleCloseModal} title={editMode ? 'Edit Student' : 'Add New Student'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input
                            type="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <textarea
                            className="form-textarea"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Batch</label>
                        <select
                            className="form-select"
                            value={formData.batch_id}
                            onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                        >
                            <option value="">No Batch</option>
                            {batches.map(batch => (
                                <option key={batch.id} value={batch.id}>
                                    {batch.name} {batch.course_name ? `- ${batch.course_name}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                            className="form-select"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="graduated">Graduated</option>
                        </select>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editMode ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Student"
                message="Are you sure you want to delete this student? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, studentId: null })}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
};

export default Students;
