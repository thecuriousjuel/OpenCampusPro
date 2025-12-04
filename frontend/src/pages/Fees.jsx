import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatINR } from '../utils/currency';

const Fees = () => {
    const { API_URL, token } = useAuth();
    const { showSuccess, showError } = useNotification();
    const [fees, setFees] = useState([]);
    const [students, setStudents] = useState([]);
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', feeId: null });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const [formData, setFormData] = useState({
        student_id: '',
        amount: '',
        due_date: '',
        description: ''
    });

    useEffect(() => {
        fetchFees();
        fetchStudents();
        fetchBatches();
    }, [filter]);

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const fetchFees = async () => {
        try {
            const url = filter === 'all' ? `${API_URL}/fees?per_page=100` : `${API_URL}/fees?status=${filter}&per_page=100`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setFees(data.fees || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
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
            console.error('Error:', error);
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
            console.error('Error:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_URL}/fees`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showSuccess('Fee record created successfully!');
                fetchFees();
                handleCloseModal();
            } else {
                const errorData = await response.json();
                showError(`Failed to create fee: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to create fee record. Please check your connection.');
        }
    };

    const handlePayment = async () => {
        const feeId = confirmDialog.feeId;
        setConfirmDialog({ isOpen: false, type: '', feeId: null });

        try {
            const response = await fetch(`${API_URL}/fees/${feeId}/pay`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (response.ok) {
                showSuccess('Payment recorded successfully!');
                fetchFees();
            } else {
                const errorData = await response.json();
                console.error('Payment error response:', errorData);
                showError(`Failed to record payment: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Payment error:', error);
            showError('Failed to record payment. Please check your connection.');
        }
    };

    const handlePaymentClick = (feeId) => {
        setConfirmDialog({ isOpen: true, type: 'payment', feeId });
    };


    const handleDelete = async () => {
        const id = confirmDialog.feeId;
        setConfirmDialog({ isOpen: false, type: '', feeId: null });

        try {
            const response = await fetch(`${API_URL}/fees/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                showSuccess('Fee record deleted successfully!');
                fetchFees();
            } else {
                const errorData = await response.json();
                showError(`Failed to delete fee: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to delete fee record. Please check your connection.');
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmDialog({ isOpen: true, type: 'delete', feeId: id });
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setFormData({ student_id: '', amount: '', due_date: '', description: '' });
        setSelectedBatch('');
    };

    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0);
    const outstanding = totalAmount - paidAmount;

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentFees = fees.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(fees.length / itemsPerPage);

    if (loading) return <div className="page-container"><div className="spinner"></div></div>;

    return (
        <div className="page-container fade-in">
            <div className="flex justify-between items-center mb-lg">
                <div>
                    <h1 className="page-title">Fee Management</h1>
                    <p className="text-muted">Track and manage student fees</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Fee Record</button>
            </div>

            <div className="dashboard-grid mb-lg">
                <div className="card">
                    <h3 className="text-primary">{formatINR(totalAmount)}</h3>
                    <p className="text-muted">Total Fees</p>
                </div>
                <div className="card">
                    <h3 className="text-success">{formatINR(paidAmount)}</h3>
                    <p className="text-muted">Collected</p>
                </div>
                <div className="card">
                    <h3 className="text-danger">{formatINR(outstanding)}</h3>
                    <p className="text-muted">Outstanding</p>
                </div>
            </div>

            <div className="card mb-lg">
                <div className="flex gap-md">
                    <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')}>All</button>
                    <button className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('pending')}>Pending</button>
                    <button className={`btn ${filter === 'paid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('paid')}>Paid</button>
                    <button className={`btn ${filter === 'overdue' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('overdue')}>Overdue</button>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                <th>Amount</th>
                                <th>Due Date</th>
                                <th>Paid Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentFees.length === 0 ? (
                                <tr><td colSpan="6" className="text-center text-muted">No fee records found</td></tr>
                            ) : (
                                currentFees.map((fee) => (
                                    <tr key={fee.id}>
                                        <td>{fee.student_code || fee.student_id}</td>
                                        <td>{fee.student_name}</td>
                                        <td>{formatINR(fee.amount)}</td>
                                        <td>{fee.due_date ? new Date(fee.due_date).toLocaleDateString() : '-'}</td>
                                        <td>{fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <span className={`badge ${fee.status === 'paid' ? 'badge-success' :
                                                fee.status === 'overdue' ? 'badge-danger' :
                                                    'badge-warning'
                                                }`}>
                                                {fee.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-sm">
                                                {fee.status !== 'paid' && (
                                                    <button type="button" className="btn btn-success btn-sm" onClick={() => handlePaymentClick(fee.id)}>💰 Pay</button>
                                                )}
                                                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(fee.id)}>🗑️</button>
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
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, fees.length)} of {fees.length} fees
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

            <Modal isOpen={showModal} onClose={handleCloseModal} title="Add Fee Record">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Batch *</label>
                        <select className="form-select" value={selectedBatch}
                            onChange={(e) => {
                                setSelectedBatch(e.target.value);
                                setFormData({ ...formData, student_id: '' });
                            }} required>
                            <option value="">Select Batch</option>
                            {batches.map(batch => (
                                <option key={batch.id} value={batch.id}>{batch.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Student *</label>
                        <select className="form-select" value={formData.student_id}
                            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                            required
                            disabled={!selectedBatch}
                        >
                            <option value="">Select Student</option>
                            {students
                                .filter(s => !selectedBatch || s.batch_id === parseInt(selectedBatch))
                                .map(student => (
                                    <option key={student.id} value={student.id}>
                                        {student.student_code || student.id} - {student.name}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Amount *</label>
                        <input type="number" step="0.01" className="form-input" value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Due Date *</label>
                        <input type="date" className="form-input" value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <input type="text" className="form-input" value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.type === 'payment' ? 'Confirm Payment' : 'Delete Fee Record'}
                message={
                    confirmDialog.type === 'payment'
                        ? 'Mark this fee as paid? This action will record the payment.'
                        : 'Are you sure you want to delete this fee record? This action cannot be undone.'
                }
                onConfirm={confirmDialog.type === 'payment' ? handlePayment : handleDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, type: '', feeId: null })}
                confirmText={confirmDialog.type === 'payment' ? 'Mark as Paid' : 'Delete'}
                type={confirmDialog.type === 'payment' ? 'primary' : 'danger'}
            />
        </div>
    );
};

export default Fees;
