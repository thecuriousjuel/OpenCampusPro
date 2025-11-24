import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Students = () => {
    const { API_URL, token } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [search, setSearch] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, studentId: null });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        status: 'active'
    });

    useEffect(() => {
        fetchStudents();
    }, [search]);

    const fetchStudents = async () => {
        try {
            const url = search ? `${API_URL}/students?search=${search}&per_page=100` : `${API_URL}/students?per_page=100`;
            const response = await fetch(url, {
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
            status: student.status
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
        setFormData({ name: '', email: '', phone: '', address: '', status: 'active' });
    };

    const handleAddNew = () => {
        setEditMode(false);
        setFormData({ name: '', email: '', phone: '', address: '', status: 'active' });
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

    return (
        <div className="page-container fade-in">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="page-title">Students</h1>
                    <p className="text-muted">Manage student records</p>
                </div>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    ➕ Add Student
                </button>
            </div>

            <div className="card mb-lg">
                <input
                    type="text"
                    className="form-input"
                    placeholder="🔍 Search students by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Enrollment Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted">
                                        No students found
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.id}>
                                        <td>{student.name}</td>
                                        <td>{student.email}</td>
                                        <td>{student.phone || '-'}</td>
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
