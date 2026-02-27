import { useState, useEffect } from 'react';
import api from '../utils/api';

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Fee Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          Add Fee Record
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4">Student</th>
                <th className="text-left p-4">Semester</th>
                <th className="text-left p-4">Total</th>
                <th className="text-left p-4">Paid</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fees.map((f) => (
                <tr key={f._id} className="border-t hover:bg-slate-50">
                  <td className="p-4">
                    {f.studentId?.studentId || f.studentId} - {f.studentId?.fullName || '-'}
                  </td>
                  <td className="p-4">{f.semester}</td>
                  <td className="p-4">Rs. {f.totalAmount?.toLocaleString()}</td>
                  <td className="p-4">Rs. {f.paidAmount?.toLocaleString()}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        f.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : f.status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {f.status !== 'paid' && (
                      <button
                        onClick={() => setShowPayModal(f)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Record Payment
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
            <h2 className="text-xl font-bold mb-4">Add Fee Record</h2>
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
                <label className="block text-sm font-medium mb-1">Semester</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semester Fee (Rs)</label>
                <input
                  type="number"
                  value={form.semesterFee}
                  onChange={(e) => setForm({ ...form, semesterFee: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lab Fee (Rs)</label>
                <input
                  type="number"
                  value={form.labFee}
                  onChange={(e) => setForm({ ...form, labFee: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Library Fee (Rs)</label>
                <input
                  type="number"
                  value={form.libraryFee}
                  onChange={(e) => setForm({ ...form, libraryFee: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-200 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Record Payment</h2>
            <p className="text-slate-600 mb-4">
              {showPayModal.studentId?.studentId} - Remaining: Rs.{' '}
              {(showPayModal.totalAmount - showPayModal.paidAmount).toLocaleString()}
            </p>
            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount (Rs)</label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={payForm.type}
                  onChange={(e) => setPayForm({ ...payForm, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="semester">Semester Fee</option>
                  <option value="lab">Lab Fee</option>
                  <option value="library">Library Fee</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Receipt No</label>
                <input
                  type="text"
                  value={payForm.receiptNo}
                  onChange={(e) => setPayForm({ ...payForm, receiptNo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowPayModal(null)} className="px-4 py-2 bg-slate-200 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
