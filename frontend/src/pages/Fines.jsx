import { useState, useEffect } from 'react';
import api from '../utils/api';

const FINE_TYPES = [
  { value: 'late_submission', label: 'Late Submission' },
  { value: 'plagiarism', label: 'Plagiarism' },
  { value: 'no_id_card', label: 'No ID Card' },
  { value: 'discipline_violation', label: 'Discipline Violation' },
];

export default function Fines() {
  const [fines, setFines] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ status: '' });
  const [form, setForm] = useState({
    studentId: '',
    type: 'late_submission',
    amount: 0,
    description: '',
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.status) params.append('status', filter.status);
    api.get(`/fines?${params}`).then((res) => {
      setFines(res.data);
      setLoading(false);
    });
    api.get('/students').then((res) => setStudents(res.data));
  }, [filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fines', form);
      setShowModal(false);
      setForm({ studentId: '', type: 'late_submission', amount: 0, description: '' });
      api.get('/fines').then((res) => setFines(res.data));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handlePay = async (id) => {
    try {
      await api.put(`/fines/${id}/pay`);
      api.get('/fines').then((res) => setFines(res.data));
    } catch (err) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="erp-h1">Disciplinary fines</h1>
          <p className="erp-muted mt-1">Issue fines and mark settlements.</p>
        </div>
        <button type="button" onClick={() => setShowModal(true)} className="erp-btn-accent">
          Add fine
        </button>
      </div>

      <div className="erp-toolbar">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="erp-select w-auto min-w-[160px]"
        >
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
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
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {fines.map((f) => (
                  <tr key={f._id}>
                    <td className="font-medium">
                      {f.studentId?.studentId || f.studentId} — {f.studentId?.fullName || '-'}
                    </td>
                    <td>{FINE_TYPES.find((t) => t.value === f.type)?.label || f.type}</td>
                    <td className="tabular-nums">Rs. {f.amount?.toLocaleString()}</td>
                    <td className="max-w-[200px] truncate text-zinc-600">{f.description || '—'}</td>
                    <td>
                      <span className={f.status === 'paid' ? 'erp-badge-ok' : 'erp-badge-warn'}>{f.status}</span>
                    </td>
                    <td className="text-right">
                      {f.status === 'pending' && (
                        <button type="button" onClick={() => handlePay(f._id)} className="erp-link">
                          Mark paid
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
              <h2 className="erp-h1 mb-6">Add fine</h2>
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
                  <label className="erp-label">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="erp-select mt-1"
                  >
                    {FINE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="erp-label">Amount (Rs)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) })}
                    className="erp-input mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="erp-input mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2 border-t border-zinc-100 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="erp-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="erp-btn-accent">
                    Add
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
