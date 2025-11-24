import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

const Courses = () => {
    const { API_URL, token } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, courseId: null });
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        credits: '',
        duration: ''
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await fetch(`${API_URL}/courses?per_page=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setCourses(data.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editMode ? `${API_URL}/courses/${selectedCourse.id}` : `${API_URL}/courses`;
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
                showSuccess(`Course ${editMode ? 'updated' : 'created'} successfully!`);
                fetchCourses();
                handleCloseModal();
            } else {
                const errorData = await response.json();
                showError(`Failed to ${editMode ? 'update' : 'create'} course: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving course:', error);
            showError(`Failed to ${editMode ? 'update' : 'create'} course. Please check your connection.`);
        }
    };

    const handleEdit = (course) => {
        setSelectedCourse(course);
        setFormData({
            name: course.name,
            code: course.code,
            description: course.description || '',
            credits: course.credits || '',
            duration: course.duration || ''
        });
        setEditMode(true);
        setShowModal(true);
    };

    const handleDelete = async () => {
        const id = confirmDialog.courseId;
        setConfirmDialog({ isOpen: false, courseId: null });

        try {
            const response = await fetch(`${API_URL}/courses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showSuccess('Course deleted successfully!');
                fetchCourses();
            } else {
                const errorData = await response.json();
                showError(`Failed to delete course: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            showError('Failed to delete course. Please check your connection.');
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmDialog({ isOpen: true, courseId: id });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditMode(false);
        setSelectedCourse(null);
        setFormData({ name: '', code: '', description: '', credits: '', duration: '' });
    };

    if (loading) return <div className="page-container"><div className="spinner"></div></div>;

    return (
        <div className="page-container fade-in">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="page-title">Courses</h1>
                    <p className="text-muted">Manage course catalog</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Course</button>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Credits</th>
                                <th>Duration</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.length === 0 ? (
                                <tr><td colSpan="5" className="text-center text-muted">No courses found</td></tr>
                            ) : (
                                courses.map((course) => (
                                    <tr key={course.id}>
                                        <td><span className="badge badge-info">{course.code}</span></td>
                                        <td>{course.name}</td>
                                        <td>{course.credits || '-'}</td>
                                        <td>{course.duration || '-'}</td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(course)}>✏️</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(course.id)}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={handleCloseModal} title={editMode ? 'Edit Course' : 'Add New Course'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Course Code *</label>
                        <input type="text" className="form-input" value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Course Name *</label>
                        <input type="text" className="form-input" value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea className="form-textarea" value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Credits</label>
                        <input type="number" className="form-input" value={formData.credits}
                            onChange={(e) => setFormData({ ...formData, credits: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Duration</label>
                        <input type="text" className="form-input" value={formData.duration} placeholder="e.g., 6 months"
                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editMode ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Delete Course"
                message="Are you sure you want to delete this course? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, courseId: null })}
                confirmText="Delete"
                type="danger"
            />
        </div>
    );
};

export default Courses;
