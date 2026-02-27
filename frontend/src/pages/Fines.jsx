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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Fine System</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          Add Fine
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4">Student</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fines.map((f) => (
                <tr key={f._id} className="border-t hover:bg-slate-50">
                  <td className="p-4">
                    {f.studentId?.studentId || f.studentId} - {f.studentId?.fullName || '-'}
                  </td>
                  <td className="p-4">
                    {FINE_TYPES.find((t) => t.value === f.type)?.label || f.type}
                  </td>
                  <td className="p-4">Rs. {f.amount?.toLocaleString()}</td>
                  <td className="p-4">{f.description || '-'}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        f.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {f.status === 'pending' && (
                      <button
                        onClick={() => handlePay(f._id)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add Fine</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student</label>
                <select
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.studentId} - {s.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {FINE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (Rs)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-200 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
