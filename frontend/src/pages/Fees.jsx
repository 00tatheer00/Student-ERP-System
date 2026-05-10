import { useState, useEffect } from 'react';
import api from '../utils/api';

function feeStatusBadge(status) {
  if (status === 'paid') return 'erp-badge-ok';
  if (status === 'partial') return 'erp-badge-warn';
  return 'erp-badge-bad';
}

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null);
  const [form, setForm] = useState({
    studentId: '',
    semester: 1,
    semesterFee: 50000,
    labFee: 5000,
    libraryFee: 2000,
  });
  const [payForm, setPayForm] = useState({ amount: 0, type: 'semester', receiptNo: '' });

  useEffect(() => {
    api.get('/fees').then((res) => {
      setFees(res.data);
      setLoading(false);
    });
    api.get('/students').then((res) => setStudents(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees', form);
      setShowModal(false);
      setForm({ studentId: '', semester: 1, semesterFee: 50000, labFee: 5000, libraryFee: 2000 });
      api.get('/fees').then((res) => setFees(res.data));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/fees/${showPayModal._id}/pay`, payForm);
      setShowPayModal(null);
      setPayForm({ amount: 0, type: 'semester', receiptNo: '' });
      api.get('/fees').then((res) => setFees(res.data));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="erp-h1">Fee management</h1>
          <p className="erp-muted mt-1">Billing, balances, and payment receipts.</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="erp-btn-accent">
          Add fee record
        </button>
      </div>

      <div className="erp-table-shell">
        {loading ? (
          <div className="erp-empty">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Semester</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f._id}>
                    <td className="font-medium">
                      {f.studentId?.studentId || f.studentId} — {f.studentId?.fullName || '-'}
                    </td>
                    <td>{f.semester}</td>
                    <td className="tabular-nums">Rs. {f.totalAmount?.toLocaleString()}</td>
                    <td className="tabular-nums">Rs. {f.paidAmount?.toLocaleString()}</td>
                    <td>
                      <span className={feeStatusBadge(f.status)}>{f.status}</span>
                    </td>
                    <td className="text-right">
                      {f.status !== 'paid' && (
                        <button type="button" onClick={() => setShowPayModal(f)} className="erp-link">
                          Record payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal erp-modal-sm">
            <div className="p-6 sm:p-8">
              <h2 className="erp-h1 mb-6">Add fee record</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="erp-label">Student</label>
                  <select
                    value={form.studentId}
                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    className="erp-select mt-1"
                    required
                  >
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.studentId} — {s.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
                    className="erp-input mt-1"
                  />
                </div>
                <div>
                  <label className="erp-label">Semester fee (Rs)</label>
                  <input
                    type="number"
                    value={form.semesterFee}
                    onChange={(e) => setForm({ ...form, semesterFee: parseInt(e.target.value) })}
                    className="erp-input mt-1"
                  />
                </div>
                <div>
                  <label className="erp-label">Lab fee (Rs)</label>
                  <input
                    type="number"
                    value={form.labFee}
                    onChange={(e) => setForm({ ...form, labFee: parseInt(e.target.value) })}
                    className="erp-input mt-1"
                  />
                </div>
                <div>
                  <label className="erp-label">Library fee (Rs)</label>
                  <input
                    type="number"
                    value={form.libraryFee}
                    onChange={(e) => setForm({ ...form, libraryFee: parseInt(e.target.value) })}
                    className="erp-input mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2 border-t border-zinc-100 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="erp-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="erp-btn-accent">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal erp-modal-sm">
            <div className="p-6 sm:p-8">
              <h2 className="erp-h1 mb-2">Record payment</h2>
              <p className="erp-muted mb-6">
                {showPayModal.studentId?.studentId} — remaining{' '}
                <span className="font-semibold text-zinc-800">
                  Rs. {(showPayModal.totalAmount - showPayModal.paidAmount).toLocaleString()}
                </span>
              </p>
              <form onSubmit={handlePay} className="space-y-4">
                <div>
                  <label className="erp-label">Amount (Rs)</label>
                  <input
                    type="number"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: parseInt(e.target.value) })}
                    className="erp-input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Type</label>
                  <select
                    value={payForm.type}
                    onChange={(e) => setPayForm({ ...payForm, type: e.target.value })}
                    className="erp-select mt-1"
                  >
                    <option value="semester">Semester fee</option>
                    <option value="lab">Lab fee</option>
                    <option value="library">Library fee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="erp-label">Receipt no.</label>
                  <input
                    type="text"
                    value={payForm.receiptNo}
                    onChange={(e) => setPayForm({ ...payForm, receiptNo: e.target.value })}
                    className="erp-input mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2 border-t border-zinc-100 pt-6">
                  <button type="button" onClick={() => setShowPayModal(null)} className="erp-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="erp-btn-accent">
                    Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
