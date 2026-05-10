import { useState, useEffect } from 'react';
import api from '../utils/api';

const DEPARTMENTS = ['CS', 'SE', 'AI', 'CY', 'DS', 'IT'];
const PROGRAMS = ['BS', 'MS'];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ department: '', semester: '', program: '', search: '' });
  const [form, setForm] = useState({
    fullName: '',
    fatherName: '',
    CNIC: '',
    phone: '',
    email: '',
    address: '',
    department: 'CS',
    program: 'BS',
    semester: 1,
    batch: new Date().getFullYear(),
    status: 'active',
  });

  const fetchStudents = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.department) params.append('department', filters.department);
    if (filters.semester) params.append('semester', filters.semester);
    if (filters.program) params.append('program', filters.program);
    if (filters.search) params.append('search', filters.search);
    api.get(`/students?${params}`)
      .then((res) => {
        setStudents(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, [filters.department, filters.semester, filters.program, filters.search]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/students/${editing._id}`, form);
      } else {
        await api.post('/students', form);
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving student');
    }
  };

  const resetForm = () => {
    setForm({
      fullName: '',
      fatherName: '',
      CNIC: '',
      phone: '',
      email: '',
      address: '',
      department: 'CS',
      program: 'BS',
      semester: 1,
      batch: new Date().getFullYear(),
      status: 'active',
    });
  };

  const handleEdit = (s) => {
    setEditing(s);
    setForm({
      fullName: s.fullName,
      fatherName: s.fatherName,
      CNIC: s.CNIC,
      phone: s.phone,
      email: s.email,
      address: s.address,
      department: s.department,
      program: s.program,
      semester: s.semester,
      batch: s.batch,
      status: s.status,
    });
    setShowModal(true);
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.department) params.append('department', filters.department);
    if (filters.semester) params.append('semester', filters.semester);
    const res = await api.get(`/students/export?${params}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openIdCard = async (id) => {
    try {
      const res = await api.get(`/students/${id}/id-card`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 120000);
    } catch (err) {
      let msg = 'Could not load ID card';
      const data = err.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const j = JSON.parse(text);
          if (j.message) msg = j.message;
        } catch {
          /* ignore */
        }
      } else if (data?.message) msg = data.message;
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Students</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium"
          >
            Export CSV
          </button>
          <label className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium cursor-pointer">
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const fd = new FormData();
                fd.append('file', file);
                try {
                  const res = await api.post('/students/import', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  alert(res.data.message);
                  fetchStudents();
                } catch (err) {
                  alert(err.response?.data?.message || 'Import failed');
                }
                e.target.value = '';
              }}
            />
          </label>
          <button
            onClick={() => {
              setEditing(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
          >
            Add Student
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="px-3 py-2 border rounded-lg w-48"
        />
        <select
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={filters.semester}
          onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
        <select
          value={filters.program}
          onChange={(e) => setFilters({ ...filters, program: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Programs</option>
          {PROGRAMS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4">ID</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Department</th>
                  <th className="text-left p-4">Program</th>
                  <th className="text-left p-4">Sem</th>
                  <th className="text-left p-4">Batch</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id} className="border-t hover:bg-slate-50">
                    <td className="p-4 font-mono text-sm">{s.studentId}</td>
                    <td className="p-4">{s.fullName}</td>
                    <td className="p-4">{s.department}</td>
                    <td className="p-4">{s.program}</td>
                    <td className="p-4">{s.semester}</td>
                    <td className="p-4">{s.batch}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => openIdCard(s._id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        ID Card
                      </button>
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-slate-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Student' : 'Add Student'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Father Name</label>
                    <input
                      type="text"
                      value={form.fatherName}
                      onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">CNIC</label>
                    <input
                      type="text"
                      value={form.CNIC}
                      onChange={(e) => setForm({ ...form, CNIC: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Department</label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Program</label>
                    <select
                      value={form.program}
                      onChange={(e) => setForm({ ...form, program: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {PROGRAMS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium mb-1">Batch</label>
                    <input
                      type="number"
                      min="2020"
                      max="2030"
                      value={form.batch}
                      onChange={(e) => setForm({ ...form, batch: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                {editing && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    {editing ? 'Update' : 'Create'}
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
